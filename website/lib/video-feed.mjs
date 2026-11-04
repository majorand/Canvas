import { AccessError } from './access.mjs';
import { requestPublic } from './video-sources.mjs';

// Only these public channels are fetched. Client input never becomes a URL.
export const feedChannels = Object.freeze([
  {id:'UC_x5XG1OV2P6uZZ5FSM9Ttw',title:'Google for Developers'},
  {id:'UCLA_DiR1FfKNvjuUpBHmylQ',title:'NASA'},
  {id:'UCsooa4yRKGN_zEE8iknghZA',title:'TED-Ed'},
  {id:'UC4a-Gbdw7vOaccHmFo40b9g',title:'Khan Academy'},
].map(Object.freeze));
const minute=60000, maxAge=15*minute, staleAge=24*60*minute;
const videoId=/^[A-Za-z0-9_-]{11}$/;
function plain(value,limit=200){
  return String(value||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_whole,entity)=>{
    if(entity[0]!=='#')return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"})[entity.toLowerCase()];
    const point=entity[1].toLowerCase()==='x'?parseInt(entity.slice(2),16):Number(entity.slice(1));
    return point>=32&&point<=0x10ffff&&!(point>=0xd800&&point<=0xdfff)?String.fromCodePoint(point):' ';
  }).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,limit);
}
function field(xml,tag){return xml.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+tag+'>','i'))?.[1]||'';}
function card(channel,{id,title,published}){
  return {id,title,author:channel.title,channelId:channel.id,published,thumbnail:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg',url:'https://www.youtube.com/watch?v='+id};
}
export function parseYoutubeFeed(xml,channel){
  if(typeof xml!=='string'||Buffer.byteLength(xml)>1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml)||!/<feed(?:\s|>)/i.test(xml)||!/<\/feed\s*>/i.test(xml))throw new Error('Invalid channel feed');
  const feedId=plain(field(xml.split(/<entry(?:\s|>)/i)[0],'yt:channelId'));
  // YouTube's feed header omits the UC prefix; each entry includes it.
  if(feedId!==channel.id&&feedId!==channel.id.slice(2))throw new Error('Channel feed did not match the requested channel');
  const items=[],seen=new Set();
  for(const match of xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry\s*>/gi)){
    const entry=match[1],id=plain(field(entry,'yt:videoId')),entryChannel=plain(field(entry,'yt:channelId')),title=plain(field(entry,'title')),timestamp=plain(field(entry,'published'));
    const date=Date.parse(timestamp);
    if(!videoId.test(id)||entryChannel!==channel.id||!title||!Number.isFinite(date)||seen.has(id))continue;
    seen.add(id);items.push(card(channel,{id,title,published:new Date(date).toISOString()}));
    if(items.length===15)break;
  }
  // A valid channel may have no public videos; malformed entries must not pass as empty.
  if(/<entry(?:\s|>)/i.test(xml)&&!items.length)throw new Error('No valid video entries');
  return items;
}
// Verified against the official channel feeds on November 4, 2026. These are
// explicitly labelled starter listings, never presented as live recommendations.
const starter = [
  ['UC_x5XG1OV2P6uZZ5FSM9Ttw','rsOiZE19RVo','Accelerate shipping to scale with Google Antigravity','2026-10-29T20:00:20Z'],
  ['UCLA_DiR1FfKNvjuUpBHmylQ','IhpBgLB8JUQ','Astronaut Anil Menon Speaks With Mark Rober From the International Space Station','2026-11-04T16:37:53Z'],
  ['UCsooa4yRKGN_zEE8iknghZA','8EtdC9Bjubk','Can you solve the Billy Bonka riddle? - Edwin F. Meyer','2026-11-03T16:00:34Z'],
  ['UC4a-Gbdw7vOaccHmFo40b9g','iPuFRtNrxbI','Free MCAT Support','2026-10-29T16:00:00Z'],
].map(([channelId,id,title,published])=>card(feedChannels.find(c=>c.id===channelId),{id,title,published}));
export function createVideoFeed({request=requestPublic,now=Date.now}={}){
  const cache=new Map(),pending=new Map(),limits=new Map();
  async function channelFeed(channel){
    const previous=cache.get(channel.id),time=now();
    if(previous && time<previous.until)return {...previous,unavailable:previous.failed};
    if(pending.has(channel.id))return pending.get(channel.id);
    const operation=(async()=>{
      try{
        const xml=await request('https://www.youtube.com/feeds/videos.xml?channel_id='+channel.id,5000);
        const items=parseYoutubeFeed(xml,channel),result={items,until:now()+maxAge,fetchedAt:now(),failed:false};cache.set(channel.id,result);return {...result,unavailable:false};
      }catch{
        const result=previous && time-previous.fetchedAt<=staleAge
          ? {...previous,until:now()+minute,failed:true}
          : {items:null,until:now()+minute,fetchedAt:now(),failed:true};
        cache.set(channel.id,result);return {...result,unavailable:true};
      }
    })().finally(()=>pending.delete(channel.id));
    pending.set(channel.id,operation);return operation;
  }
  async function run(body={},key=''){
    const chosen=body.channel===undefined?'all':body.channel;
    if(typeof chosen!=='string'||(chosen!=='all'&&!feedChannels.some(c=>c.id===chosen)))throw new AccessError(400,'Choose one of the available video channels.');
    const time=now(),bucket=limits.get(key);
    if(bucket&&time-bucket.time<minute&&bucket.count>=12)throw new AccessError(429,'Wait a minute before refreshing the video feed again.');
    if(!bucket||time-bucket.time>=minute)limits.set(key,{time,count:1});else bucket.count++;
    if(limits.size>1000)limits.delete(limits.keys().next().value);
    const channels=chosen==='all'?feedChannels:feedChannels.filter(c=>c.id===chosen);
    const results=await Promise.all(channels.map(channelFeed));
    const unavailableChannels=channels.filter((_c,i)=>results[i].unavailable).map(c=>c.id);
    const items=results.flatMap(result=>result.items?.slice(0,12)||[]);
    const hasListings=results.some(result=>result.items!==null);
    let source='YouTube channel feeds',message;
    if(!hasListings){source='starter videos';items.push(...starter.filter(item=>chosen==='all'||item.channelId===chosen));message='Live channel feeds are unavailable. Showing a small starter selection verified on November 4, 2026; these are not current recommendations.';}
    else if(unavailableChannels.length)message='Some channel feeds are unavailable. Available listings and any cached listings are shown; playback still depends on the video provider.';
    const unique=[...new Map(items.map(item=>[item.id,item])).values()].sort((a,b)=>Date.parse(b.published)-Date.parse(a.published));
    return {items:unique,channels:feedChannels,source,stale:results.some(result=>result.unavailable&&result.items!==null),unavailableChannels,...(message?{message}:{})};
  }
  return {run};
}
export const videoFeed=createVideoFeed();

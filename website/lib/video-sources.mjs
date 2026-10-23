import https from 'node:https';
import { lookup } from 'node:dns';
import { BlockList } from 'node:net';
import { AccessError } from './access.mjs';

const registry='https://api.invidious.io/instances.json';
const pipedRegistry='https://raw.githubusercontent.com/TeamPiped/documentation/main/content/docs/public-instances/index.md';
const seeds=['https://pipedapi.ducks.party','https://pipedapi.adminforge.de','https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://pipedapi.orangenet.cc'];
const blocked=new BlockList();
for(const [ip,bits] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]])blocked.addSubnet(ip,bits,'ipv4');
export const publicAddress=address=>!blocked.check(address,'ipv4');
export function publicUrl(value) {
  try {const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password && (!u.port || u.port==='443') && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) && !/\.(?:local|localhost|internal|test|invalid)$/i.test(u.hostname)?u:null;}catch{return null;}
}
// No arbitrary client URLs, redirects, private DNS destinations, credentials, or
// unbounded bodies. Pin the checked DNS address to this actual HTTPS connection.
export function requestPublic(url,timeout=4000) {
  return new Promise((resolve,reject)=>{
    if(!publicUrl(url)){reject(new Error('Invalid public endpoint'));return;}
    const req=https.get(url,{family:4,headers:{Accept:'application/json, text/plain','User-Agent':'Canvas-video/1.0'},lookup(host,_options,callback){
      lookup(host,{family:4},(error,address,family)=>callback(error || (!publicAddress(address)?new Error('Private destination'):null),address,family));
    }},res=>{
      if(res.statusCode!==200){clearTimeout(timer);res.destroy();reject(Object.assign(new Error('Instance unavailable'),{status:res.statusCode}));return;}
      let body='',size=0;res.setEncoding('utf8');
      res.on('data',chunk=>{size+=Buffer.byteLength(chunk);if(size>1024*1024){req.destroy(new Error('Instance response too large'));return;}body+=chunk;});
      res.on('end',()=>{clearTimeout(timer);resolve(body);});res.on('error',error=>{clearTimeout(timer);reject(error);});
    });
    const timer=setTimeout(()=>req.destroy(new Error('Instance timed out')),timeout);
    req.on('error',error=>{clearTimeout(timer);reject(error);});
  });
}
export function directory(invidious,pipedText) {
  const inv=Array.isArray(invidious)?invidious.filter(([,v])=>v?.api===true && v.type==='https' && !v.monitor?.down && publicUrl(v.uri)).map(([,v])=>({kind:'invidious',url:new URL(v.uri).origin})):[];
  const listed=[...String(pipedText).matchAll(/^.*\| (https:\/\/[^ |]+) \|/gm)].map(m=>m[1]).filter(publicUrl);
  const piped=[...new Set([...seeds.filter(url=>listed.includes(url)),...listed])].map(url=>({kind:'piped',url:new URL(url).origin}));
  return [...inv,...piped].slice(0,12).map(p=>({...p,id:p.kind+':'+new URL(p.url).hostname}));
}
function videoId(value){return typeof value==='string' && /^[\w-]{11}$/.test(value)?value:null;}
export function normalizeSearch(data,provider) {
  const items=provider.kind==='piped'?data.items:data;
  if(!Array.isArray(items))throw new Error('Invalid search results');
  return items.filter(item=>provider.kind==='piped'?item.type==='stream':item.type==='video').map(item=>{
    let id=item.videoId;try{id ||=new URL(item.url,provider.url).searchParams.get('v');}catch{}
    return {id:videoId(id),title:String(item.title || '').slice(0,200),author:String(item.author || item.uploaderName || '').slice(0,100),duration:Number(item.lengthSeconds || item.duration)||0};
  }).filter(item=>item.id).slice(0,12);
}
export function normalizeSources(data,provider) {
  const list=provider.kind==='piped'?data.videoStreams:data.formatStreams;
  if(!Array.isArray(list))return [];
  return list.filter(s=>provider.kind!=='piped' || s.videoOnly===false).map(s=>{
    let url=publicUrl(s.url);if(!url)return null;
    // Invidious progressive formats can reference Google's IP-bound URLs.
    // Ask the instance to proxy them instead, retaining their signed parameters.
    if(provider.kind==='invidious' && /(^|\.)googlevideo\.com$/.test(url.hostname)){
      const originalHost=url.hostname;url=new URL(url.pathname+url.search,provider.url);url.searchParams.set('host',originalHost);url.searchParams.set('local','true');
    }
    const type=String(s.mimeType || s.type || '').split(';')[0];
    if(!['video/mp4','video/webm'].includes(type))return null;
    return {url:url.href,type,quality:String(s.quality || s.qualityLabel || 'Standard').slice(0,40),height:parseInt(s.height || s.quality || s.qualityLabel)||360};
  }).filter(Boolean).sort((a,b)=>Math.abs(a.height-360)-Math.abs(b.height-360)).slice(0,4);
}
export function createVideoSources({request=requestPublic,now=Date.now,providers}={}) {
  let known,until=0,pending,active=0;const cooldown=new Map(),limits=new Map(),preferred=new Map();
  async function instances(){
    if(providers)return providers;
    if(known && now()<until)return known;
    pending ||=Promise.allSettled([request(registry),request(pipedRegistry)]).then(results=>{
      let inv=[];try{inv=JSON.parse(results[0].value || '[]');}catch{}
      known=directory(inv,results[1].value || '');until=now()+3600000;return known;
    }).finally(()=>{pending=null;});return pending;
  }
  async function run(action,body,key) {
    const search=action==='video-search',query=String(body.query || '').trim();
    if(search?(!query || query.length>160):!videoId(body.id))throw new AccessError(400,search?'Enter a search of 1–160 characters.':'Choose a valid video ID.');
    const bucket=limits.get(key);if(bucket && now()-bucket.time<60000 && bucket.count>=12)throw new AccessError(429,'Wait a minute before searching or retrying more videos.');
    if(!bucket || now()-bucket.time>=60000)limits.set(key,{time:now(),count:1});else bucket.count++;
    if(limits.size>1000)limits.delete(limits.keys().next().value);
    if(active>=4)throw new AccessError(429,'The video service is busy. Try again shortly.');
    active++;
    try {
      const exclude=Array.isArray(body.exclude)?body.exclude.slice(0,12):[];
      const all=await instances(), attempts=[];
      const choices=[...all].sort((a,b)=>Number(b.id===preferred.get(action))-Number(a.id===preferred.get(action)));
      for(const provider of choices.filter(p=>!exclude.includes(p.id) && (cooldown.get(action+p.id)||0)<=now()).slice(0,6)){
        const path=search?(provider.kind==='piped'?'/search?q='+encodeURIComponent(query)+'&filter=videos':'/api/v1/search?type=video&q='+encodeURIComponent(query)):(provider.kind==='piped'?'/streams/'+body.id:'/api/v1/videos/'+body.id+'?local=true');
        try {
          const data=JSON.parse(await request(provider.url+path));
          if(data.error)throw new Error('Instance rejected request');
          const result=search?{items:normalizeSearch(data,provider)}:{sources:normalizeSources(data,provider),title:String(data.title || '').slice(0,200)};
          if(!search && !result.sources.length)throw new Error('No combined audio/video stream');
          preferred.set(action,provider.id);return {...result,provider:provider.id,attempts};
        }catch(error){cooldown.set(action+provider.id,now()+(error.status===429?300000:60000));attempts.push({provider:provider.id,status:error.status===429?'rate-limited':'unavailable'});}
      }
      return {items:[],sources:[],attempts,fallback:'embed',message:'The public video APIs are unavailable, blocked, or provide no supported audio/video stream. The official YouTube embed is the last fallback.'};
    } finally {active--;}
  }
  return {run};
}
export const videoSources=createVideoSources();

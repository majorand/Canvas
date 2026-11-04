import test from 'node:test';
import assert from 'node:assert/strict';
import { feedChannels,parseYoutubeFeed,createVideoFeed } from '../lib/video-feed.mjs';
const channel=feedChannels[0], id='M7lc1UVf-VE', published='2026-11-04T12:00:00+00:00';
const entry=({video=id,channelId=channel.id,title='A &amp; B',date=published}={})=>'<entry><yt:videoId>'+video+'</yt:videoId><yt:channelId>'+channelId+'</yt:channelId><title>'+title+'</title><published>'+date+'</published></entry>';
const atom=(entries=entry(),channelId=channel.id)=>'<feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015"><yt:channelId>'+channelId.slice(2)+'</yt:channelId>'+entries+'</feed>';

test('official-shaped Atom feeds produce bounded plain metadata, deduplicate entries, and preserve dates',()=>{
  const items=parseYoutubeFeed(atom(entry({title:'&#65; &amp; B &amp;lt;tag&amp;gt; &#x1F680;'})+entry()),channel);
  assert.equal(items.length,1);
  assert.deepEqual(items[0],{id,title:'A & B &lt;tag&gt; 🚀',author:channel.title,channelId:channel.id,published:'2026-11-04T12:00:00.000Z',thumbnail:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg',url:'https://www.youtube.com/watch?v='+id});
  assert.equal(parseYoutubeFeed(atom(entry({title:'<![CDATA[A <b>video</b>]]>'})),channel)[0].title,'A video');
  assert.equal(parseYoutubeFeed(atom(entry({title:'x'.repeat(400)})),channel)[0].title.length,200);
  const many=Array.from({length:30},(_v,i)=>entry({video:String(i).padStart(11,'0')})).join('');
  assert.equal(parseYoutubeFeed(atom(many),channel).length,15);
});

test('feed parser rejects HTML challenges, XML entity declarations, oversized and malformed or wrong-channel feeds',()=>{
  for(const xml of ['<html>Sign in to verify you are human</html>','<!DOCTYPE feed><feed></feed>','<!ENTITY external SYSTEM "file:///secret">'+atom(),atom().replace('</feed>',''),atom('',feedChannels[1].id),atom(entry({video:'invalid'})),atom(entry({channelId:feedChannels[1].id})),atom(entry({date:'invalid'})),atom(entry({title:'<b></b>'})),atom('x'.repeat(1024*1024))])assert.throws(()=>parseYoutubeFeed(xml,channel));
  assert.deepEqual(parseYoutubeFeed(atom(''),channel),[]);
  assert.equal(parseYoutubeFeed(atom(entry({channelId:feedChannels[1].id})+entry()),channel).length,1);
});

test('feed only fetches fixed official channel URLs, shares pending work, caches results, and bounds response cards',async()=>{
  let count=0,release;const wait=new Promise(resolve=>{release=resolve;});
  const service=createVideoFeed({request:async(url,timeout)=>{count++;assert.equal(timeout,5000);const parsed=new URL(url);assert.equal(parsed.origin,'https://www.youtube.com');assert.equal(parsed.pathname,'/feeds/videos.xml');const channelId=parsed.searchParams.get('channel_id');assert.ok(feedChannels.some(c=>c.id===channelId));await wait;return atom(Array.from({length:15},(_v,i)=>entry({video:String(i).padStart(11,'0'),channelId})).join(''),channelId);}});
  const first=service.run({},'member-one'),second=service.run({},'member-two');
  assert.equal(count,4);release();
  const [a,b]=await Promise.all([first,second]);assert.deepEqual(a,b);assert.equal(a.source,'YouTube channel feeds');assert.equal(a.items.length,12);assert.deepEqual(a.unavailableChannels,[]);assert.equal(a.stale,false);
  assert.deepEqual(a.channels,feedChannels);await service.run({},'member-three');assert.equal(count,4);
});

test('selected feed fetches one allowed channel and invalid input never makes requests',async()=>{
  const calls=[];const chosen=feedChannels[1];
  const service=createVideoFeed({request:async url=>{calls.push(url);return atom(entry({channelId:chosen.id}),chosen.id);}});
  for(const input of ['https://127.0.0.1','https://evil.example',42,null,{},'unknown'])await assert.rejects(service.run({channel:input},'user'),e=>e.status===400);
  assert.equal(calls.length,0);
  const result=await service.run({channel:chosen.id},'user');assert.equal(calls.length,1);assert.equal(result.items[0].channelId,chosen.id);
});

test('failed feeds report starter fallback, cool down retries, recover, and use stale metadata only for a day',async()=>{
  let time=0,count=0,fail=true;
  const service=createVideoFeed({now:()=>time,request:async()=>{count++;if(fail)throw new Error('temporarily unavailable');return atom();}});
  let result=await service.run({channel:channel.id},'user');assert.equal(result.source,'starter videos');assert.match(result.message,/not current recommendations/);assert.equal(result.items[0].channelId,channel.id);assert.deepEqual(result.unavailableChannels,[channel.id]);assert.equal(result.stale,false);
  await service.run({channel:channel.id},'user');assert.equal(count,1);
  time=60001;fail=false;result=await service.run({channel:channel.id},'user');assert.equal(result.source,'YouTube channel feeds');assert.equal(result.stale,false);assert.equal(count,2);
  time+=15*60000+1;fail=true;result=await service.run({channel:channel.id},'user');assert.equal(result.source,'YouTube channel feeds');assert.equal(result.stale,true);assert.equal(result.items[0].id,id);assert.match(result.message,/cached listings/);
  time+=24*60*60000+1;result=await service.run({channel:channel.id},'user');assert.equal(result.source,'starter videos');assert.equal(result.stale,false);assert.notEqual(result.items[0].id,id);
});

test('malformed feeds fall back honestly but a valid empty channel stays empty',async()=>{
  let result=await createVideoFeed({request:async()=>'<html>Access denied</html>'}).run({channel:channel.id},'user');
  assert.equal(result.source,'starter videos');assert.equal(result.items.length,1);
  result=await createVideoFeed({request:async()=>atom('')}).run({channel:channel.id},'user');
  assert.equal(result.source,'YouTube channel feeds');assert.equal(result.items.length,0);assert.deepEqual(result.unavailableChannels,[]);
});

test('feed refresh is rate limited per member even when metadata is cached',async()=>{
  let time=0,count=0;const service=createVideoFeed({now:()=>time,request:async()=>{count++;return atom();}});
  for(let i=0;i<12;i++)await service.run({channel:channel.id},'one');
  await assert.rejects(service.run({channel:channel.id},'one'),e=>e.status===429);
  await service.run({channel:channel.id},'two');assert.equal(count,1);
  time=60000;await service.run({channel:channel.id},'one');assert.equal(count,1);
});

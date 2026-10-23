import test from 'node:test';
import assert from 'node:assert/strict';
import { directory,publicUrl,publicAddress,normalizeSearch,normalizeSources,createVideoSources,requestPublic } from '../lib/video-sources.mjs';
const piped={kind:'piped',url:'https://piped.example',id:'piped:piped.example'}, inv={kind:'invidious',url:'https://inv.example',id:'invidious:inv.example'};
const id='aqz-KE-bpKQ';
const streams={title:'Video',videoStreams:[{url:'https://media.example/video.mp4',mimeType:'video/mp4',videoOnly:false,quality:'360p'},{url:'https://media.example/silent.mp4',mimeType:'video/mp4',videoOnly:true}]};

test('video sources reject private destinations, credentials, HTTP, redirects and unsafe schemes',async()=>{
  for(const url of ['http://piped.example','https://127.0.0.1/','https://[::1]/','https://user:secret@piped.example','https://service.local/','https://service.example:8443','javascript:alert(1)'])assert.equal(publicUrl(url),null);
  for(const address of ['127.0.0.1','10.1.2.3','172.17.0.1','192.168.4.100','169.254.169.254','100.64.0.2','224.0.0.1'])assert.equal(publicAddress(address),false);
  assert.equal(publicAddress('1.1.1.1'),true);
  await assert.rejects(requestPublic('https://127.0.0.1'),/Invalid/);
});
test('instance discovery honors disabled APIs, downtime and official HTTPS lists',()=>{
  const found=directory([['one',{api:true,type:'https',uri:inv.url}],['two',{api:false,type:'https',uri:'https://off.example'}],['three',{api:true,type:'https',uri:'https://down.example',monitor:{down:true}}]],'Name | https://piped.example | EU |\nUnsafe | https://localhost/ | EU |');
  assert.deepEqual(found,[inv,piped]);
});
test('normalization preserves combined audio/video only, sanitizes search IDs, and proxies Invidious Google URLs',()=>{
  assert.equal(normalizeSources(streams,piped).length,1);
  assert.equal(normalizeSources({formatStreams:[{url:'https://rr.googlevideo.com/videoplayback?expire=123',type:'video/mp4; codecs="avc1"',qualityLabel:'360p'}]},inv)[0].url,'https://inv.example/videoplayback?expire=123&host=rr.googlevideo.com&local=true');
  assert.deepEqual(normalizeSearch({items:[{type:'stream',url:'/watch?v='+id,title:'<script>plain text</script>'},{type:'stream',url:'javascript:alert(1)'},{type:'channel',url:'/watch?v='+id}]},piped).map(x=>x.id),[id]);
  assert.equal(normalizeSources({videoStreams:[{url:'https://127.0.0.1/',mimeType:'video/mp4',videoOnly:false}]},piped).length,0);
});
test('fallback skips failed and rate-limited APIs, excludes failed media providers, and caches health per operation',async()=>{
  const second={...piped,id:'piped:second.example',url:'https://second.example'};const calls=[];
  const service=createVideoSources({providers:[piped,second,inv],request:async url=>{calls.push(url);if(url.startsWith(piped.url))throw Object.assign(new Error('limited'),{status:429});return JSON.stringify(url.startsWith(second.url)?streams:{formatStreams:[{url:'https://media.example/other.webm',type:'video/webm',qualityLabel:'360p'}]});}});
  const first=await service.run('video-resolve',{id},'user');assert.equal(first.provider,second.id);assert.equal(first.attempts[0].status,'rate-limited');
  const next=await service.run('video-resolve',{id,exclude:[second.id]},'user');assert.equal(next.provider,inv.id);assert.equal(calls.filter(x=>x.startsWith(piped.url)).length,1);
});
test('API failure, malformed data and video-only sources produce a clear last-resort fallback',async()=>{
  for(const value of ['not JSON',JSON.stringify({error:'blocked'}),JSON.stringify({videoStreams:streams.videoStreams.slice(1)})]){
    const service=createVideoSources({providers:[piped],request:async()=>value});const result=await service.run('video-resolve',{id},'user');assert.equal(result.fallback,'embed');assert.deepEqual(result.sources,[]);
  }
});
test('search uses API results in-window and bounds request volume and inputs',async()=>{
  const service=createVideoSources({providers:[piped],request:async()=>JSON.stringify({items:[{type:'stream',url:'/watch?v='+id,title:'Found video'}]})});
  assert.equal((await service.run('video-search',{query:'video'},'user')).items[0].id,id);
  await assert.rejects(service.run('video-search',{query:'x'.repeat(161)},'user'),e=>e.status===400);
  await assert.rejects(service.run('video-resolve',{id:'https://127.0.0.1/'},'user'),e=>e.status===400);
  for(let i=0;i<11;i++)await service.run('video-search',{query:'video'},'user');
  await assert.rejects(service.run('video-search',{query:'video'},'user'),e=>e.status===429);
});

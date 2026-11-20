import test from 'node:test';
import assert from 'node:assert/strict';
import { directory,publicUrl,publicAddress,normalizeSearch,normalizeSources,createVideoSources,requestPublic } from '../lib/video-sources.mjs';
const piped={kind:'piped',url:'https://piped.example',id:'piped:piped.example'}, inv={kind:'invidious',url:'https://inv.example',id:'invidious:inv.example'};
const id='aqz-KE-bpKQ';
const streams={title:'Video',videoStreams:[{url:'https://media.example/video.mp4',mimeType:'video/mp4',videoOnly:false,quality:'360p'},{url:'https://media.example/silent.mp4',mimeType:'video/mp4',videoOnly:true}]};
const registry='https://api.invidious.io/instances.json',pipedRegistry='https://raw.githubusercontent.com/TeamPiped/documentation/main/content/docs/public-instances/index.md';
const pinned='https://yt.chocolatemoo53.com';
const adaptive={dashUrl:inv.url+'/api/manifest/dash/id/'+id,adaptiveFormats:[{type:'video/mp4; codecs="avc1"'},{type:'audio/mp4; codecs="mp4a"'}]};
const combined={url:'https://media.example/video.mp4',type:'video/mp4',qualityLabel:'360p'};

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

test('Invidious DASH keeps audio and video together and is among the first two format attempts',()=>{
  const expected={kind:'dash',type:'application/dash+xml',url:adaptive.dashUrl+'?local=true',quality:'Adaptive video',height:360};
  assert.deepEqual(normalizeSources(adaptive,inv),[expected]);
  assert.deepEqual(normalizeSources({...adaptive,formatStreams:[{...combined,qualityLabel:'720p'},combined,{...combined,qualityLabel:'480p'}]},inv).map(s=>s.kind || s.height),[360,'dash',480,720]);
  assert.deepEqual(normalizeSources({...adaptive,dashUrl:adaptive.dashUrl+'?local=false&token=preserved'},inv),[{...expected,url:adaptive.dashUrl+'?local=true&token=preserved'}]);
  assert.equal(normalizeSources({...adaptive,videoStreams:streams.videoStreams},piped).some(s=>s.kind==='dash'),false);
});

test('DASH rejects untrusted manifest origins, unsafe URLs, missing audio or video, and malformed formats',()=>{
  for(const dashUrl of ['https://other.example/manifest.mpd','http://inv.example/manifest.mpd','https://user:secret@inv.example/manifest.mpd','https://127.0.0.1/manifest.mpd','https://inv.example:8443/manifest.mpd','/manifest.mpd','javascript:alert(1)']){
    assert.deepEqual(normalizeSources({...adaptive,dashUrl},inv),[]);
  }
  for(const adaptiveFormats of [undefined,[],[adaptive.adaptiveFormats[0]],[adaptive.adaptiveFormats[1]],[null,{type:'text/plain'}]])assert.deepEqual(normalizeSources({...adaptive,adaptiveFormats},inv),[]);
  assert.deepEqual(normalizeSources({...adaptive,formatStreams:[null],adaptiveFormats:[null,...adaptive.adaptiveFormats]},inv).map(s=>s.kind),['dash']);
});

test('cold discovery uses only the pinned official Invidious fallback and retries incomplete registries after a minute',async()=>{
  for(const initial of ['unreachable','not JSON','{}','[null]']){
    let time=0,registryCalls=0;const calls=[];
    const service=createVideoSources({now:()=>time,request:async url=>{
      calls.push(url);
      if(url===registry){registryCalls++;if(initial==='unreachable')throw new Error('Timed out');return initial;}
      if(url===pipedRegistry)return '';
      assert.ok(url.startsWith(pinned+'/api/v1/videos/'));
      return JSON.stringify({...adaptive,dashUrl:pinned+'/api/manifest/dash/id/'+id});
    }});
    assert.equal((await service.run('video-resolve',{id},'user')).provider,'invidious:yt.chocolatemoo53.com');
    time=59999;await service.run('video-resolve',{id},'user');assert.equal(registryCalls,1);
    time=60000;await service.run('video-resolve',{id},'user');assert.equal(registryCalls,2);
    assert.equal(calls.some(url=>url.includes('pipedapi.')),false);
  }
});

test('discovery retains the last valid Invidious list during an outage and recovers on the short retry',async()=>{
  let time=0,stage=0,registryCalls=0;
  const second={...inv,url:'https://new.example',id:'invidious:new.example'};
  const service=createVideoSources({now:()=>time,request:async url=>{
    if(url===registry){registryCalls++;if(stage===1)throw new Error('Timed out');const provider=stage===2?second:inv;return JSON.stringify([[new URL(provider.url).hostname,{api:true,type:'https',uri:provider.url}]]);}
    if(url===pipedRegistry)return '';
    assert.equal(url.startsWith(pinned),false);
    return JSON.stringify({formatStreams:[combined]});
  }});
  assert.equal((await service.run('video-resolve',{id},'user')).provider,inv.id);
  stage=1;time=3600000;assert.equal((await service.run('video-resolve',{id},'user')).provider,inv.id);assert.equal(registryCalls,2);
  stage=2;time+=59999;assert.equal((await service.run('video-resolve',{id},'user')).provider,inv.id);assert.equal(registryCalls,2);
  time++;assert.equal((await service.run('video-resolve',{id},'user')).provider,second.id);assert.equal(registryCalls,3);
});

test('valid empty or API-disabled directories suppress the pinned fallback even during subsequent outages',async()=>{
  for(const value of [[],[['yt.chocolatemoo53.com',{api:false,type:'https',uri:pinned}]]]){
    let time=0,fail=false;const calls=[];
    const service=createVideoSources({now:()=>time,request:async url=>{
      calls.push(url);if(url===registry){if(fail)throw new Error('Timed out');return JSON.stringify(value);}
      if(url===pipedRegistry)return 'Name | '+piped.url+' | EU |';
      assert.ok(url.startsWith(piped.url+'/'));return JSON.stringify(streams);
    }});
    assert.equal((await service.run('video-resolve',{id},'user')).provider,piped.id);
    fail=true;time=3600000;assert.equal((await service.run('video-resolve',{id},'user')).provider,piped.id);
    assert.equal(calls.some(url=>url.startsWith(pinned)),false);
  }
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
test('public API bot challenges have a safe diagnostic without leaking upstream stack traces',async()=>{
  const service=createVideoSources({providers:[piped],request:async()=>JSON.stringify({error:'SignInConfirmNotBotException: LOGIN_REQUIRED sign in to confirm not a bot\nsecret diagnostic stack'})});
  const result=await service.run('video-resolve',{id},'user');
  assert.equal(result.attempts[0].status,'bot-verification');assert.equal(JSON.stringify(result).includes('secret diagnostic'),false);
});
test('search uses API results in-window and bounds request volume and inputs',async()=>{
  const service=createVideoSources({providers:[piped],request:async()=>JSON.stringify({items:[{type:'stream',url:'/watch?v='+id,title:'Found video'}]})});
  assert.equal((await service.run('video-search',{query:'video'},'user')).items[0].id,id);
  await assert.rejects(service.run('video-search',{query:'x'.repeat(161)},'user'),e=>e.status===400);
  await assert.rejects(service.run('video-resolve',{id:'https://127.0.0.1/'},'user'),e=>e.status===400);
  for(let i=0;i<11;i++)await service.run('video-search',{query:'video'},'user');
  await assert.rejects(service.run('video-search',{query:'video'},'user'),e=>e.status===429);
});

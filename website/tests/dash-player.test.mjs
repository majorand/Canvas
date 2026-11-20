import test from 'node:test';
import assert from 'node:assert/strict';
import {createDashPlayback} from '../public/dash-player.mjs';
const tick=async()=>{for(let i=0;i<3;i++)await new Promise(resolve=>setImmediate(resolve));};
const source={kind:'dash',type:'application/dash+xml',url:'https://video.example/api/manifest/dash/id/M7lc1UVf-VE?local=true'};
function fixture(overrides={}) {
  const listeners=new Map(),timers=new Map(),events=[],engines=[];let imports=0,nextTimer=0;
  const media={src:'blob:adaptive-stream',paused:true,playCalls:0,loadCalls:0,
    addEventListener(name,callback){listeners.set(name,callback);},removeEventListener(name,callback){if(listeners.get(name)===callback)listeners.delete(name);},
    pause(){this.paused=true;listeners.get('pause')?.();},play(){this.paused=false;this.playCalls++;listeners.get('playing')?.();return Promise.resolve();},
    removeAttribute(name){delete this[name];},load(){this.loadCalls++;},
  };
  const library={MediaPlayer:()=>({create(){
    const engine={settings:[],credentials:[],listeners:new Map(),resets:0,
      on(name,callback){this.listeners.set(name,callback);},off(name,callback){if(this.listeners.get(name)===callback)this.listeners.delete(name);},
      updateSettings(value){this.settings.push(value);},setXHRWithCredentialsForType(...args){this.credentials.push(args);},
      initialize(...args){this.initialized=args;},reset(){this.resets++;},
    };engines.push(engine);return engine;
  }})};
  const options={media,source,start:45,mediaSourceSupported:true,
    loadLibrary:async()=>{imports++;return library;},
    setTimer(callback,delay){timers.set(++nextTimer,{callback,delay});return nextTimer;},clearTimer:id=>timers.delete(id),
    onReady:()=>events.push('ready'),onPlaying:()=>events.push('playing'),onPause:()=>events.push('pause'),onEnded:()=>events.push('ended'),onFailure:()=>events.push('failed'),...overrides};
  const player=createDashPlayback(options);
  return {player,media,events,engines,library,timers,listeners,get imports(){return imports;},emit:name=>listeners.get(name)?.(),expire:()=>[...timers.values()][0]?.callback()};
}

test('DASH uses the local lazy engine with no autoplay, bounded bitrate and no provider credentials',async()=>{
  const f=fixture();assert.equal(f.imports,0);await tick();
  assert.equal(f.imports,1);const engine=f.engines[0];
  assert.deepEqual(engine.initialized,[f.media,source.url,false,45]);assert.equal(f.media.playCalls,0);
  const settings=engine.settings[0];assert.equal(settings.streaming.abr.maxBitrate.video,700);assert.equal(settings.streaming.abr.initialBitrate.video,400);assert.equal(settings.streaming.abr.maxBitrate.audio,128);
  assert.equal(settings.streaming.buffer.bufferTimeDefault,6);assert.equal(settings.streaming.lastBitrateCachingInfo.enabled,false);assert.equal(settings.streaming.lastMediaSettingsCachingInfo.enabled,false);
  assert.ok(engine.credentials.length>=3);assert.ok(engine.credentials.every(([,value])=>value===false));
  f.emit('loadeddata');await f.player.ready;assert.deepEqual(f.events,['ready']);assert.equal(f.timers.size,0);assert.equal(f.media.playCalls,0);
  assert.equal(engine.settings.at(-1).streaming.scheduling.scheduleWhilePaused,false);
  await f.player.playVideo();assert.equal(f.media.paused,false);f.player.pauseVideo();assert.equal(f.media.paused,true);assert.deepEqual(f.events,['ready','playing','pause']);
  f.player.destroy();assert.equal(engine.resets,1);assert.equal(f.media.src,undefined);assert.equal(f.listeners.size,0);
});

test('Off rejects pending readiness immediately even while the local library import is unresolved',async()=>{
  let finish;const f=fixture({loadLibrary:()=>new Promise(resolve=>{finish=resolve;})});await tick();
  f.player.destroy();await assert.rejects(f.player.ready,/cancelled/);assert.equal(f.timers.size,0);assert.equal(f.media.src,undefined);
  finish(f.library);await tick();assert.equal(f.engines.length,0);assert.equal(f.listeners.size,0);assert.deepEqual(f.events,[]);
});

test('closing before initialization prevents even the lazy library request',async()=>{
  const f=fixture();f.player.destroy();await assert.rejects(f.player.ready,/cancelled/);await tick();assert.equal(f.imports,0);assert.equal(f.engines.length,0);
});

test('Off aborts an initializing engine and late native or engine callbacks cannot revive it',async()=>{
  const f=fixture();await tick();const engine=f.engines[0],lateReady=f.listeners.get('loadeddata'),lateError=engine.listeners.get('error');
  f.player.destroy();await assert.rejects(f.player.ready,/cancelled/);
  lateReady();lateError();f.emit('playing');await tick();
  assert.equal(engine.resets,1);assert.equal(engine.listeners.size,0);assert.equal(f.listeners.size,0);assert.deepEqual(f.events,[]);assert.equal(f.media.src,undefined);assert.equal(f.timers.size,0);
});

test('an 18-second manifest or media timeout releases the engine so the caller can fall back',async()=>{
  const f=fixture();await tick();assert.equal([...f.timers.values()][0].delay,18000);f.expire();
  await assert.rejects(f.player.ready,/timed out/);assert.equal(f.engines[0].resets,1);assert.equal(f.media.src,undefined);assert.equal(f.timers.size,0);assert.deepEqual(f.events,[]);
});

test('a post-ready streaming failure stops network work and requests exactly one provider fallback',async()=>{
  const f=fixture();await tick();const engine=f.engines[0],lateError=engine.listeners.get('error');f.emit('loadeddata');await f.player.ready;
  lateError();lateError();f.emit('error');assert.equal(engine.resets,1);assert.deepEqual(f.events,['ready','failed']);assert.equal(f.media.src,undefined);assert.equal(f.listeners.size,0);
});

test('unsupported MSE and unsafe or wrong-kind sources skip the local engine without requesting a provider',async()=>{
  for(const overrides of [{mediaSourceSupported:false},{source:{...source,url:'http://video.example/manifest'}},{source:{...source,url:'https://user:secret@video.example/manifest'}},{source:{...source,kind:'file'}},{source:{...source,type:'text/html'}}]){
    const f=fixture(overrides);await assert.rejects(f.player.ready,/not supported|Unsupported/);assert.equal(f.imports,0);assert.equal(f.engines.length,0);assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
  }
});

test('a local library loading failure releases pending playback for normal provider fallback',async()=>{
  const f=fixture({loadLibrary:async()=>{throw new Error('Local engine unavailable');}});await assert.rejects(f.player.ready,/Local engine unavailable/);assert.equal(f.engines.length,0);assert.equal(f.media.src,undefined);assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
});


test('optional timing and subtitle errors do not discard an otherwise playable DASH stream',async()=>{
  const f=fixture();f.library.MediaPlayer.errors={TIME_SYNC_FAILED_ERROR_CODE:16,TIMED_TEXT_ERROR_ID_PARSE_CODE:33};await tick();
  const engine=f.engines[0],error=engine.listeners.get('error');
  error({error:{code:16}});error({error:{code:33}});assert.equal(engine.resets,0);assert.equal(f.timers.size,1);assert.deepEqual(f.events,[]);
  f.emit('loadeddata');await f.player.ready;error({error:{code:16}});error({error:{code:33}});assert.equal(engine.resets,0);assert.deepEqual(f.events,['ready']);
  error({error:{code:27}});assert.equal(engine.resets,1);assert.deepEqual(f.events,['ready','failed']);
});

test('recoverable errors follow the engine exported constants rather than an unrelated error shape',async()=>{
  const f=fixture();f.library.MediaPlayer.errors={TIME_SYNC_FAILED_ERROR_CODE:116,TIMED_TEXT_ERROR_ID_PARSE_CODE:133};await tick();
  const engine=f.engines[0],error=engine.listeners.get('error');error({error:{code:116}});error({error:{code:133}});assert.equal(engine.resets,0);
  error({code:116});await assert.rejects(f.player.ready,/unavailable/);assert.equal(engine.resets,1);
});

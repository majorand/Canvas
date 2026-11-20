// The bundled DASH engine is loaded only after a provider offers an adaptive stream.
// Its media-player build excludes DRM and never receives workspace credentials.
let libraryPromise;
function loadDashLibrary() {
  if(!libraryPromise)libraryPromise=import('./video/dash.mediaplayer.min.js').catch(error=>{libraryPromise=null;throw error;});
  return libraryPromise;
}
export function createDashPlayback({media,source,start=0,isCurrent=()=>true,loadLibrary=loadDashLibrary,
  mediaSourceSupported=Boolean(globalThis.MediaSource || globalThis.WebKitMediaSource || globalThis.ManagedMediaSource),
  timeoutMs=18000,setTimer=setTimeout,clearTimer=clearTimeout,
  onReady=()=>{},onPlaying=()=>{},onPause=()=>{},onEnded=()=>{},onFailure=()=>{}}) {
  let engine,engineError,disposed=false,ready=false,settled=false,timer;
  let resolveReady,rejectReady;
  const pending=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
  const current=()=>!disposed && isCurrent();
  const settle=error=>{if(settled)return;settled=true;error?rejectReady(error):resolveReady();};
  const listeners=new Map();
  const listen=(name,listener)=>{listeners.set(name,listener);media.addEventListener(name,listener);};
  function destroy(error=new Error('Playback cancelled')) {
    if(disposed)return;
    disposed=true;clearTimer(timer);
    for(const [name,listener] of listeners)media.removeEventListener(name,listener);
    listeners.clear();
    try{if(engineError)engine?.off('error',engineError);}catch{}
    try{engine?.reset();}catch{}
    engine=null;
    try{media.pause();media.removeAttribute('src');media.load();}catch{}
    settle(error);
  }
  function fail(error) {
    if(!current())return;
    const wasReady=ready,position=media.currentTime;
    destroy(error instanceof Error?error:new Error('Adaptive media unavailable'));
    if(wasReady)onFailure(Number.isFinite(position)?position:undefined);
  }
  function pauseScheduling(){try{engine?.updateSettings({streaming:{scheduling:{scheduleWhilePaused:false}}});}catch{}}
  listen('loadeddata',()=>{
    if(!current() || ready)return;
    ready=true;clearTimer(timer);pauseScheduling();
    onReady();settle();
  });
  listen('error',()=>fail(new Error('Adaptive media unavailable')));
  listen('playing',()=>{if(current())onPlaying();});
  listen('pause',()=>{if(current()){if(ready)pauseScheduling();onPause();}});
  listen('ended',()=>{if(current())onEnded();});
  timer=setTimer(()=>fail(new Error('Adaptive media timed out')),timeoutMs);
  Promise.resolve().then(async()=>{
    if(!current())return;
    const url=new URL(source?.url);
    if(source?.kind!=='dash' || source.type!=='application/dash+xml' || url.protocol!=='https:' || url.username || url.password)throw new Error('Unsupported adaptive stream');
    if(!mediaSourceSupported)throw new Error('Adaptive video is not supported by this browser');
    if(typeof loadLibrary!=='function')throw new Error('Adaptive player unavailable');
    const {MediaPlayer}=await loadLibrary();
    if(!current())return;
    engine=MediaPlayer().create();
    engineError=()=>fail(new Error('Adaptive media unavailable'));
    engine.on('error',engineError);
    engine.updateSettings({debug:{logLevel:0},streaming:{
      lastBitrateCachingInfo:{enabled:false},lastMediaSettingsCachingInfo:{enabled:false},
      buffer:{bufferTimeDefault:6,bufferTimeAtTopQuality:6,bufferTimeAtTopQualityLongForm:6},
      abr:{initialBitrate:{video:400,audio:96},maxBitrate:{video:700,audio:128},limitBitrateByPortal:true},
      manifestRequestTimeout:12000,fragmentRequestTimeout:12000,
      retryAttempts:{MPD:1,MediaSegment:1,InitializationSegment:1},
    }});
    for(const type of ['MPD','XLinkExpansion','MediaSegment','InitializationSegment','IndexSegment'])engine.setXHRWithCredentialsForType(type,false);
    // Allow the first frame to buffer while paused. Disable further paused scheduling
    // once loadeddata fires, so minimizing/pausing does not keep filling the buffer.
    engine.initialize(media,url.href,false,Number.isFinite(start) && start>0?start:0);
  }).catch(fail);
  return {ready:pending,
    playVideo:()=>{if(!current())return Promise.resolve();return media.play();},
    pauseVideo:()=>{if(current()){if(ready)pauseScheduling();media.pause();}},
    destroy};
}

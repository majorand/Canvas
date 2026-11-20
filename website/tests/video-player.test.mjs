import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { tabDocument } from './fixtures/tab-dom.mjs';
import { youtubeVideo,youtubeEmbed,youtubeError,youtubeDestination } from '../public/youtube-url.mjs';
import { createVideoLibrary } from '../public/video-library.mjs';
import { createDashPlayback } from '../public/dash-player.mjs';
const tick=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));};
const id='aqz-KE-bpKQ';
async function fixture(accountApi,options={}){
  const {document,element}=tabDocument(),controls=[],windowEvents=new Map(),embeddedPlayers=[],dashEngines=[];
  const find=document.getElementById;document.getElementById=id=>find(id)||element(id);
  document.head=element('head');
  element('youtube-panel').hidden=true;
  const shortcut=element('youtube-shortcut');
  document.querySelectorAll=selector=>selector==='[data-youtube-open]'?[shortcut]:[];
  document.fullscreenElement=options.fullscreen?element('workspace'):null;
  document.exitFullscreen=options.exitFullscreen || (()=>{document.fullscreenElement=null;return Promise.resolve();});
  const create=document.createElement;
  document.createElement=tag=>{const node=create(tag);if(tag==='video')Object.assign(node,{canPlayType:()=>true,currentTime:0,paused:true,removeEventListener(name,callback){if(this.listeners.get(name)===callback)this.listeners.delete(name);},removeAttribute(name){delete this[name];},play(){this.paused=false;this.listeners.get('playing')?.();return Promise.resolve();},pause(){this.paused=true;this.listeners.get('pause')?.();},load(){if(!this.src)return;const src=this.src;queueMicrotask(()=>{if(this.src===src && !this.removed)this.listeners.get(src.includes('/fail')?'error':'loadeddata')?.();});}});return node;};
  const timers=new Map();let sequence=0;
  const dashLibrary={MediaPlayer:()=>({create(){const engine={resets:0,settings:[],listeners:new Map(),
    on(name,callback){this.listeners.set(name,callback);},off(name,callback){if(this.listeners.get(name)===callback)this.listeners.delete(name);},
    updateSettings(value){this.settings.push(value);},setXHRWithCredentialsForType(){},
    initialize(media,url,autoplay,start){this.initialized={media,url,autoplay,start};media.src='blob:adaptive-media';queueMicrotask(()=>media.listeners.get(url.includes('/fail')?'error':'loadeddata')?.());},
    reset(){this.resets++;if(this.initialized)this.initialized.media.currentTime=0;},
  };dashEngines.push(engine);return engine;}})};
  const adaptive=options=>createDashPlayback({...options,loadLibrary:windowDashLibrary,mediaSourceSupported:optionsSupported,
    setTimer:callback=>{timers.set(++sequence,callback);return sequence;},clearTimer:id=>timers.delete(id)});
  const windowDashLibrary=options.loadDashLibrary || (async()=>dashLibrary),optionsSupported=options.mediaSourceSupported??true;
  const context=vm.createContext({document,URL,Date,Number,createDashPlayback:adaptive,windowOptions:{currentUrl:()=>"",...options},youtubeVideo,youtubeEmbed,youtubeError,youtubeDestination,createVideoLibrary,accountApi,recordNavigation(){},
    location:{href:'https://majorand.github.io/Canvas/workspace.html',origin:'https://majorand.github.io'},
    setTimeout:callback=>{timers.set(++sequence,callback);return sequence;},clearTimeout:id=>timers.delete(id),
    floatingWindow(panel,options){const control={show(){panel.hidden=false;},close(){panel.hidden=true;options.onClose?.();},dock(){},float(){},minimize(){options.onMinimize?.(true);}};controls.push(control);return control;},
    window:{addEventListener(name,listener){windowEvents.set(name,listener);},YT:{Player:class{constructor(_iframe,{events}){this.events=events;embeddedPlayers.push(this);queueMicrotask(()=>events.onReady());}destroy(){this.destroyed=true;}playVideo(){this.events.onStateChange({data:1});}pauseVideo(){this.events.onStateChange({data:2});}}}}
  });
  const source=(await readFile(new URL('../public/workspace-windows.mjs',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace('export function','function');
  vm.runInContext(source,context);const windows=vm.runInContext('initWorkspaceWindows(windowOptions)',context);
  const fire=(name,event='click')=>element(name).listeners.get(event)?.({preventDefault(){}});
  return {element,document,controls,fire,windows,embeddedPlayers,dashEngines,dashLibrary,fireWindow:name=>windowEvents.get(name)?.(),load(value=id){element('youtube-url').value=value;fire('youtube-form','submit');}};
}
test('native playback tries another format after media failure and preserves controls and minimize behavior',async()=>{
  const f=await fixture(async()=>({provider:'piped:working.example',sources:[{url:'https://media.example/fail.mp4',type:'video/mp4',quality:'360p'},{url:'https://media.example/works.webm',type:'video/webm',quality:'360p'}]}));
  f.load();await tick();assert.match(f.element('youtube-status').textContent,/Ready via piped/);
  const media=f.document.getElementById('youtube-media');assert.match(media.src,/works/);assert.equal(f.element('youtube-video').children[0].tagName,'VIDEO');
  f.fire('youtube-play');assert.equal(media.paused,false);assert.match(f.element('youtube-status').textContent,/Playing via/);
  f.controls[1].minimize();assert.equal(media.paused,true);f.controls[1].close();assert.equal(media.src,undefined);
});
test('closing the window cancels late API results without creating a hidden player',async()=>{
  let resolve;const f=await fixture(()=>new Promise(done=>{resolve=done;}));f.load();f.controls[1].close();resolve({fallback:'embed',sources:[]});await tick();assert.equal(f.element('youtube-video').children.length,0);
});
test('a later stream failure falls through to another provider then the official embed with the playback position',async()=>{
  const calls=[];const f=await fixture(async(_action,body)=>{calls.push(JSON.parse(JSON.stringify(body)));return calls.length===1?{provider:'piped:one.example',sources:[{url:'https://media.example/works.mp4',type:'video/mp4',quality:'360p'}]}:{sources:[],fallback:'embed'};});
  f.load();await tick();const media=f.document.getElementById('youtube-media');media.currentTime=41;media.listeners.get('error')();await tick();
  assert.deepEqual(calls[1].exclude,['piped:one.example']);assert.equal(new URL(f.document.getElementById('youtube-embed').src).searchParams.get('start'),'41');
  assert.match(f.element('youtube-status').textContent,/Official embed fallback ready/);
});
test('search renders safe buttons in the existing window and can open a selected result',async()=>{
  const calls=[];const f=await fixture(async(action,body)=>{calls.push({action,body});return action==='video-search'?{provider:'piped:one.example',items:[{id,title:'<img onerror=bad()>',author:'Author'}]}:{sources:[],fallback:'embed'};});
  f.element('youtube-search').value='sample video';await f.fire('youtube-search-form','submit');
  const card=f.element('youtube-search-results').children[0],button=card.children[0];assert.equal(button.children[1].textContent,'<img onerror=bad()>');assert.equal(card.children[1].children[0].textContent,'Author');button.listeners.get('click')();await tick();
  const resolved=calls.find(call=>call.action==='video-resolve');assert.equal(resolved.body.id,id);
});

test('returning to the feed invalidates late playback resolution',async()=>{
  let resolve;const f=await fixture(action=>action==='video-resolve'?new Promise(done=>{resolve=done;}):Promise.resolve({items:[],channels:[]}));
  f.load();f.fire('youtube-back-feed');resolve({sources:[],fallback:'embed'});await tick();
  assert.equal(f.element('youtube-watch').hidden,true);assert.equal(f.element('youtube-video').children.length,0);
});
test('invalid links show a visible error while browsing without opening a blank watch view',async()=>{
  const f=await fixture(async()=>({items:[],channels:[]}));f.element('youtube-watch').hidden=true;
  f.load('https://example.com/not-a-video');await tick();
  assert.equal(f.element('youtube-link-status').hidden,false);assert.match(f.element('youtube-link-status').textContent,/YouTube/);assert.equal(f.element('youtube-watch').hidden,true);
});


test('opening the dedicated viewer invokes its handoff callback once and passes the source tab',async()=>{
  const opened=[],sourceTab={id:'site-tab-source'};
  const f=await fixture(async()=>({items:[],channels:[],sources:[],fallback:'embed'}),{currentUrl:()=> 'https://youtube.com/watch?v='+id,onOpen:tab=>opened.push(tab)});
  f.fire('youtube-current');await tick();assert.equal(opened.length,1);assert.equal(opened[0],undefined);
  assert.equal(f.windows.openYouTube('https://youtu.be/'+id,undefined,sourceTab),true);await tick();
  assert.equal(opened.length,2);assert.equal(opened[1],sourceTab);
  assert.equal(f.windows.openYouTube('https://example.com/'),false);assert.equal(opened.length,2);
  f.load();await tick();assert.equal(opened.length,2,'choosing another video inside an already open viewer does not hand off another website');
});

test('YouTube mode starts off without requests and follows shortcut, minimize, and window-close state',async()=>{
  const calls=[];const f=await fixture(async action=>{calls.push(action);return {items:[],channels:[]};});
  assert.equal(f.element('youtube-mode').getAttribute('aria-checked'),'false');assert.equal(f.element('youtube-mode-state').textContent,'Off');assert.equal(f.element('youtube-panel').hidden,true);assert.deepEqual(calls,[]);
  f.fire('youtube-mode');await tick();
  assert.equal(f.element('youtube-mode').getAttribute('aria-checked'),'true');assert.equal(f.element('youtube-mode-state').textContent,'On');assert.equal(f.element('youtube-panel').hidden,false);assert.deepEqual(calls,['video-feed']);
  f.controls[1].minimize();assert.equal(f.element('youtube-mode').getAttribute('aria-checked'),'true');
  f.controls[1].close();assert.equal(f.element('youtube-mode').getAttribute('aria-checked'),'false');assert.equal(f.element('youtube-panel').hidden,true);
  f.fire('youtube-shortcut');await tick();assert.equal(f.element('youtube-mode').getAttribute('aria-checked'),'true');
});

test('switching mode off stops native playback while leaving unrelated website content attached',async()=>{
  const f=await fixture(async()=>({provider:'piped:working.example',sources:[{url:'https://media.example/works.mp4',type:'video/mp4',quality:'360p'}]}));
  const website=f.element('web-frame');website.src='https://example.com/';
  f.windows.openYouTube('https://youtu.be/'+id);await tick();const media=f.document.getElementById('youtube-media');
  f.fire('youtube-play');assert.equal(media.paused,false);assert.equal(f.element('youtube-mode').getAttribute('aria-checked'),'true');
  f.fire('youtube-mode');await tick();
  assert.equal(media.paused,true);assert.equal(media.src,undefined);assert.equal(f.element('youtube-video').children.length,0);assert.equal(f.element('youtube-mode').getAttribute('aria-checked'),'false');
  assert.equal(website.src,'https://example.com/');assert.equal(website.removed,false);
});

test('mode off cancels late video and feed results without reopening or replacing the hidden view',async()=>{
  let finishVideo;const video=await fixture(action=>action==='video-resolve'?new Promise(resolve=>{finishVideo=resolve;}):Promise.resolve({items:[],channels:[]}));
  video.windows.openYouTube('https://youtu.be/'+id);video.fire('youtube-mode');finishVideo({sources:[],fallback:'embed'});await tick();
  assert.equal(video.element('youtube-panel').hidden,true);assert.equal(video.element('youtube-video').children.length,0);assert.equal(video.element('youtube-mode').getAttribute('aria-checked'),'false');
  let finishFeed;const feed=await fixture(()=>new Promise(resolve=>{finishFeed=resolve;}));feed.fire('youtube-mode');feed.fire('youtube-mode');
  finishFeed({items:[{id,title:'Late upload'}],channels:[]});await tick();
  assert.equal(feed.element('youtube-panel').hidden,true);assert.equal(feed.element('youtube-search-results').children.length,0);assert.equal(feed.element('youtube-mode-state').textContent,'Off');
});

test('automatic handoff enables mode, and sign-out close or page departure stops embed callbacks',async()=>{
  const f=await fixture(async()=>({sources:[],fallback:'embed',items:[],channels:[]}));
  f.windows.openYouTube('https://youtu.be/'+id);await tick();const embedded=f.embeddedPlayers[0];
  assert.equal(f.element('youtube-mode').getAttribute('aria-checked'),'true');f.windows.closePlayers();
  assert.equal(embedded.destroyed,true);embedded.events.onReady();embedded.events.onStateChange({data:1});
  assert.equal(f.element('youtube-play').disabled,true);assert.equal(f.element('youtube-mode-state').textContent,'Off');assert.equal(f.element('youtube-video').children.length,0);assert.doesNotMatch(f.element('youtube-status').textContent,/Playing/);
  f.fire('youtube-shortcut');await tick();assert.equal(f.element('youtube-mode-state').textContent,'On');f.fireWindow('pagehide');assert.equal(f.element('youtube-mode-state').textContent,'Off');assert.equal(f.element('youtube-panel').hidden,true);
});

test('a full-screen exit finishing after mode off never reopens the viewer',async()=>{
  let rejectExit,exits=0;const f=await fixture(async()=>({items:[],channels:[]}),{fullscreen:true,exitFullscreen:()=>{exits++;return new Promise((_resolve,reject)=>{rejectExit=reject;});}});
  f.fire('youtube-mode');assert.equal(exits,1);f.fire('youtube-mode');rejectExit(new Error('Fullscreen exit cancelled'));await tick();
  assert.equal(f.element('youtube-mode-state').textContent,'Off');assert.equal(f.element('youtube-panel').hidden,true);assert.equal(f.element('youtube-link-status').hidden,true);
});

test('mode control is a native keyboard button with switch semantics and explicit state',async()=>{
  const html=await readFile(new URL('../public/workspace.html',import.meta.url),'utf8');
  const control=html.match(/<button\b[^>]*id="youtube-mode"[^>]*>[\s\S]*?<\/button>/)?.[0];
  assert.ok(control);assert.match(control,/type="button"/);assert.match(control,/role="switch"/);assert.match(control,/aria-checked="false"/);assert.match(control,/aria-label="YouTube mode"/);assert.match(control,/aria-controls="youtube-panel"/);assert.match(control,/id="youtube-mode-state"[^>]*>Off</);assert.doesNotMatch(control,/data-youtube-open/);
});


test('a rejected full-screen exit leaves mode off and explains how to reopen in the visible browser panel',async()=>{
  const f=await fixture(async()=>({items:[],channels:[]}),{fullscreen:true,exitFullscreen:()=>Promise.reject(new Error('Unavailable'))});
  f.fire('youtube-mode');await tick();
  assert.equal(f.element('youtube-mode-state').textContent,'Off');assert.equal(f.element('youtube-panel').hidden,true);assert.equal(f.element('youtube-fullscreen-hint').hidden,false);
});


test('a synchronous full-screen rejection does not reopen or fetch behind an off switch',async()=>{
  const calls=[];const f=await fixture(async action=>{calls.push(action);return {items:[],channels:[]};},{fullscreen:true,exitFullscreen:()=>{throw new Error('Unavailable');}});
  f.windows.openYouTube('https://youtube.com/results?search_query=space');await tick();
  assert.equal(f.element('youtube-mode-state').textContent,'Off');assert.equal(f.element('youtube-panel').hidden,true);assert.deepEqual(calls,[]);assert.equal(f.element('youtube-fullscreen-hint').hidden,false);
});


test('adaptive-only video uses the existing native controls without autoplay and stops its engine on mode off',async()=>{
  const f=await fixture(async()=>({provider:'invidious:working.example',sources:[{kind:'dash',url:'https://media.example/works.mpd',type:'application/dash+xml',quality:'Adaptive video'}]}));
  f.windows.openYouTube('https://youtu.be/'+id+'?t=45');await tick();
  const engine=f.dashEngines[0],media=f.document.getElementById('youtube-media');assert.equal(engine.initialized.autoplay,false);assert.equal(engine.initialized.start,45);assert.equal(media.paused,true);assert.match(f.element('youtube-status').textContent,/Ready via invidious/);assert.equal(f.element('youtube-video').children[0].tagName,'VIDEO');assert.equal(f.embeddedPlayers.length,0);
  f.fire('youtube-play');assert.equal(media.paused,false);f.controls[1].minimize();assert.equal(media.paused,true);assert.equal(f.element('youtube-mode-state').textContent,'On');
  f.fire('youtube-mode');await tick();assert.equal(engine.resets,1);assert.equal(media.src,undefined);assert.equal(f.element('youtube-video').children.length,0);assert.equal(f.element('youtube-mode-state').textContent,'Off');
});

test('adaptive initialization failure resets streaming and falls back to another available format',async()=>{
  const f=await fixture(async()=>({provider:'invidious:working.example',sources:[{kind:'dash',url:'https://media.example/fail.mpd',type:'application/dash+xml',quality:'Adaptive video'},{url:'https://media.example/works.mp4',type:'video/mp4',quality:'360p'}]}));
  f.load();await tick();assert.equal(f.dashEngines[0].resets,1);assert.match(f.document.getElementById('youtube-media').src,/works.mp4/);assert.match(f.element('youtube-status').textContent,/Ready via/);assert.equal(f.embeddedPlayers.length,0);
});

test('mode off during a delayed DASH module import prevents late playback or provider retries',async()=>{
  let finish,calls=0;const f=await fixture(async()=>{calls++;return {provider:'invidious:working.example',sources:[{kind:'dash',url:'https://media.example/works.mpd',type:'application/dash+xml',quality:'Adaptive video'}]};},{loadDashLibrary:()=>new Promise(resolve=>{finish=resolve;})});
  f.windows.openYouTube('https://youtu.be/'+id);await tick();f.fire('youtube-mode');finish(f.dashLibrary);await tick();
  assert.equal(calls,1);assert.equal(f.dashEngines.length,0);assert.equal(f.embeddedPlayers.length,0);assert.equal(f.element('youtube-video').children.length,0);assert.equal(f.element('youtube-mode-state').textContent,'Off');assert.equal(f.element('youtube-panel').hidden,true);
});

test('a playing DASH failure carries its position into provider fallback before clearing the media',async()=>{
  const calls=[];const f=await fixture(async(_action,body)=>{calls.push(JSON.parse(JSON.stringify(body)));return calls.length===1?{provider:'invidious:working.example',sources:[{kind:'dash',url:'https://media.example/works.mpd',type:'application/dash+xml',quality:'Adaptive video'}]}:{sources:[],fallback:'embed'};});
  f.load();await tick();const media=f.document.getElementById('youtube-media');media.currentTime=49;f.dashEngines[0].listeners.get('error')();await tick();
  assert.equal(f.dashEngines[0].resets,1);assert.deepEqual(calls[1].exclude,['invidious:working.example']);assert.equal(new URL(f.document.getElementById('youtube-embed').src).searchParams.get('start'),'49');assert.match(f.element('youtube-status').textContent,/Official embed fallback ready/);
});

test('a browser without MediaSource falls through to the existing last-resort embed',async()=>{
  let calls=0;const f=await fixture(async()=>++calls===1?{provider:'invidious:working.example',sources:[{kind:'dash',url:'https://media.example/works.mpd',type:'application/dash+xml',quality:'Adaptive video'}]}:{sources:[],fallback:'embed'},{mediaSourceSupported:false});
  f.load();await tick();assert.equal(f.dashEngines.length,0);assert.equal(f.embeddedPlayers.length,1);assert.match(f.element('youtube-status').textContent,/Official embed fallback ready/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { tabDocument } from './fixtures/tab-dom.mjs';
import { youtubeVideo,youtubeEmbed,youtubeError } from '../public/youtube-url.mjs';
const tick=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));};
const id='aqz-KE-bpKQ';
async function fixture(accountApi){
  const {document,element}=tabDocument(),controls=[];
  const find=document.getElementById;document.getElementById=id=>find(id)||element(id);
  document.head=element('head');
  const create=document.createElement;
  document.createElement=tag=>{const node=create(tag);if(tag==='video')Object.assign(node,{canPlayType:()=>true,currentTime:0,paused:true,removeAttribute(name){delete this[name];},play(){this.paused=false;this.listeners.get('playing')?.();return Promise.resolve();},pause(){this.paused=true;this.listeners.get('pause')?.();},load(){if(!this.src)return;const src=this.src;queueMicrotask(()=>{if(this.src===src && !this.removed)this.listeners.get(src.includes('/fail')?'error':'loadeddata')?.();});}});return node;};
  const timers=new Map();let sequence=0;
  const context=vm.createContext({document,URL,Date,Number,youtubeVideo,youtubeEmbed,youtubeError,accountApi,recordNavigation(){},
    location:{href:'https://majorand.github.io/Canvas/workspace.html',origin:'https://majorand.github.io'},
    setTimeout:callback=>{timers.set(++sequence,callback);return sequence;},clearTimeout:id=>timers.delete(id),
    floatingWindow(panel,options){const control={show(){panel.hidden=false;},close(){panel.hidden=true;options.onClose?.();},dock(){},float(){},minimize(){options.onMinimize?.(true);}};controls.push(control);return control;},
    window:{addEventListener(){},YT:{Player:class{constructor(_iframe,{events}){this.events=events;queueMicrotask(()=>events.onReady());}destroy(){}playVideo(){this.events.onStateChange({data:1});}pauseVideo(){this.events.onStateChange({data:2});}}}}
  });
  const source=(await readFile(new URL('../public/workspace-windows.mjs',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace('export function','function');
  vm.runInContext(source,context);vm.runInContext('initWorkspaceWindows({currentUrl:()=>""})',context);
  const fire=(name,event='click')=>element(name).listeners.get(event)?.({preventDefault(){}});
  return {element,document,controls,fire,load(value=id){element('youtube-url').value=value;fire('youtube-form','submit');}};
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
  const button=f.element('youtube-search-results').children[0];assert.equal(button.textContent,'<img onerror=bad()> · Author');button.listeners.get('click')();await tick();
  assert.equal(calls[1].action,'video-resolve');assert.equal(calls[1].body.id,id);
});

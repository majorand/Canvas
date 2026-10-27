import test from 'node:test';
import assert from 'node:assert/strict';
import { youtubeVideo, youtubeEmbed, youtubeError } from '../public/youtube-url.mjs';
import { fitWindow,moveWindow,resizeWindow } from '../public/window-geometry.mjs';
import { floatingWindow } from '../public/floating-window.mjs';

test('YouTube links accept video formats and timestamps while rejecting unrelated hosts and executable input',()=>{
  const id='M7lc1UVf-VE';
  for(const input of [id,'https://youtu.be/'+id,'https://www.youtube.com/watch?v='+id,'youtube.com/shorts/'+id,'https://m.youtube.com/live/'+id,'https://www.youtube-nocookie.com/embed/'+id]) assert.equal(youtubeVideo(input).id,id);
  assert.equal(youtubeVideo('https://youtu.be/'+id+'?t=1h2m3s').start,3723);
  assert.equal(youtubeVideo('https://www.youtube.com/watch?v='+id+'&start=30').start,30);
  for(const input of ['javascript:alert(1)','https://youtube.com.attacker.test/watch?v='+id,'https://example.com/watch?v='+id,'https://user:secret@youtube.com/watch?v='+id,'https://youtube.com/playlist?list=invalid','https://youtu.be/not-an-id'])assert.throws(()=>youtubeVideo(input));
  const embed=new URL(youtubeEmbed({id,start:45},'https://majorand.github.io'));
  assert.equal(embed.origin,'https://www.youtube-nocookie.com');assert.equal(embed.searchParams.get('origin'),'https://majorand.github.io');assert.equal(embed.searchParams.get('start'),'45');assert.equal(embed.searchParams.get('autoplay'),'0');assert.equal(embed.searchParams.get('enablejsapi'),'1');
  assert.match(youtubeError(153),/identify/);assert.match(youtubeError(150),/owner/);assert.match(youtubeError(100),/private/);
});
test('moving and resizing keep the title bar and window within the viewport, including small displays',()=>{
  const viewport={width:1200,height:800,top:48},start={x:100,y:100,width:600,height:450};
  assert.deepEqual(moveWindow(start,-200,-200,viewport),{x:0,y:48,width:600,height:450});
  assert.deepEqual(moveWindow(start,2000,2000,viewport),{x:600,y:350,width:600,height:450});
  assert.deepEqual(resizeWindow(start,2000,2000,viewport),{x:100,y:100,width:1100,height:700});
  assert.deepEqual(resizeWindow(start,-1000,-1000,viewport),{x:100,y:100,width:320,height:260});
  assert.deepEqual(fitWindow(start,{width:280,height:400,top:48}),{x:0,y:48,width:280,height:352});
});

test('edge resizing anchors the opposite edge and clamps to screen and minimum size',()=>{
  const view={width:1200,height:800,top:48},start={x:100,y:100,width:600,height:450};
  assert.deepEqual(resizeWindow(start,100,999,view,undefined,'e'),{x:100,y:100,width:700,height:450});
  assert.deepEqual(resizeWindow(start,999,100,view,undefined,'s'),{x:100,y:100,width:600,height:550});
  assert.deepEqual(resizeWindow(start,100,100,view,undefined,'nw'),{x:200,y:200,width:500,height:350});
  assert.deepEqual(resizeWindow(start,-999,-999,view,undefined,'nw'),{x:0,y:48,width:700,height:502});
  assert.deepEqual(resizeWindow(start,999,999,view,undefined,'nw'),{x:380,y:290,width:320,height:260});
});

test('window pointer drag and resize capture their pointer, preserve embedded content, and dock without navigation',()=>{
  const listeners=new Map(); const classes=new Set();const styles={};
  const handles=new Map();let paused=0,closed=0,captured;
  const handle=selector=>{if(!handles.has(selector))handles.set(selector,{textContent:'',dataset:{},listeners:new Map(),addEventListener(name,cb){this.listeners.set(name,cb)},setPointerCapture:id=>{captured=id},releasePointerCapture:()=>{captured=null},setAttribute(){}});return handles.get(selector);};
  const panel={ownerDocument:{createElement:()=>handle(Symbol())},append(){},style:new Proxy({removeProperty:key=>delete styles[key]},{set:(_,key,value)=>{styles[key]=value;return true}}),classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:name=>classes.has(name),toggle(name,state){const next=state??!classes.has(name);next?classes.add(name):classes.delete(name);return next;}},querySelector:handle,
    getBoundingClientRect:()=>({left:parseFloat(styles.left||100),top:parseFloat(styles.top||100),width:parseFloat(styles.width||600),height:classes.has('window-minimized')?42:parseFloat(styles.height||450)}),addEventListener:(name,cb)=>listeners.set(name,cb)};
  const old=globalThis.window;globalThis.window={innerWidth:1200,innerHeight:800,addEventListener(){}};
  try{
    const control=floatingWindow(panel,{onClose:()=>closed++,onMinimize:()=>paused++});control.float();
    const title=handle('[data-window-titlebar]'),resize=handle('[data-window-resize]');
    const event={button:0,target:{closest:()=>null},currentTarget:title,pointerId:7,clientX:100,clientY:100,preventDefault(){}};
    title.listeners.get('pointerdown')(event);title.listeners.get('pointermove')({...event,clientX:200,clientY:160});
    assert.equal(styles.left,'200px');assert.equal(styles.top,'160px');assert.equal(captured,7);assert.ok(classes.has('window-interacting'));
    title.listeners.get('pointercancel')(event);assert.equal(captured,null);assert.ok(!classes.has('window-interacting'));
    resize.listeners.get('keydown')({target:resize,key:'ArrowRight',preventDefault(){}});assert.equal(styles.width,'608px');
    handle('[data-window-minimize]').listeners.get('click')();assert.equal(paused,1);
    const fullHeight=styles.height;
    title.listeners.get('keydown')({target:title,key:'ArrowRight',preventDefault(){}});
    handle('[data-window-minimize]').listeners.get('click')();assert.equal(styles.height,fullHeight);
    control.dock();assert.ok(!classes.has('floating'));assert.ok(!classes.has('window-minimized'));assert.equal(styles.left,undefined);
    control.close();assert.equal(panel.hidden,true);assert.equal(closed,1);
  }finally{globalThis.window=old;}
});

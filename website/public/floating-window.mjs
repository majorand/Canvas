import { fitWindow, moveWindow, resizeWindow } from './window-geometry.mjs';
let topLayer = 120;
export function floatingWindow(panel, { onClose = () => {}, onMinimize = () => {}, minimum = {width:320,height:260} } = {}) {
  const titlebar = panel.querySelector('[data-window-titlebar]');
  const resize = panel.querySelector('[data-window-resize]');
  resize.dataset.windowResize='se';
  const edges=['n','s','e','w','ne','nw','sw'].map(edge=>{
    const handle=panel.ownerDocument.createElement('div');handle.dataset.windowResize=edge;
    handle.tabIndex=0;handle.setAttribute('role','button');
    handle.setAttribute('aria-label','Resize '+edge.replace('n','top ').replace('s','bottom ').replace('e','right ').replace('w','left ').trim()+' edge. Drag or use arrow keys.');
    panel.append(handle);return handle;
  });
  const handles=[resize,...edges];
  const toggle = panel.querySelector('[data-window-toggle]');
  let floating = false, maximized = false, previous, interaction, minimizedSize;
  const viewport = () => ({ width:window.innerWidth,height:window.innerHeight,top:Math.min(48,window.innerHeight-100) });
  const bounds = () => { const r=panel.getBoundingClientRect();return {x:r.left,y:r.top,width:r.width,height:r.height}; };
  const focus = () => { if (floating) panel.style.zIndex=String(++topLayer); };
  function apply(rect) {
    const r=fitWindow(rect,viewport(),minimum);
    for(const [key,value] of Object.entries({left:r.x,top:r.y,width:r.width,height:r.height})) panel.style[key]=value+'px';
  }
  function float() {
    if (floating) { focus(); return; }
    const r=bounds(); floating=true; panel.classList.add('floating');
    const height=Math.min(Math.max(r.height,460),650);
    apply({x:Math.max(12,r.x),y:Math.min(Math.max(65,r.y),Math.max(65,(window.innerHeight-height)/2)),width:Math.min(r.width || 800,900),height});
    focus(); if(toggle)toggle.textContent='Dock';
  }
  function dock() {
    end(); floating=false;maximized=false;minimizedSize=null;panel.classList.remove('floating','maximized','window-minimized');
    for(const property of ['left','top','width','height','z-index'])panel.style.removeProperty(property);
    if(toggle)toggle.textContent='Float';
    panel.querySelector('[data-window-maximize]')?.setAttribute('aria-pressed','false');
  }
  function restoreMinimized() {
    if(!panel.classList.contains('window-minimized'))return;
    panel.classList.remove('window-minimized');
    if(minimizedSize)apply({...bounds(),...minimizedSize});
    minimizedSize=null;
  }
  function maximize() {
    restoreMinimized();
    if(!floating)float();
    if(maximized){maximized=false;apply(previous);}else{previous=bounds();maximized=true;apply({x:0,y:48,width:window.innerWidth,height:window.innerHeight-48});}
    panel.classList.toggle('maximized',maximized);
    panel.querySelector('[data-window-maximize]')?.setAttribute('aria-pressed',String(maximized));
  }
  function begin(event,mode) {
    if(event.button!==0 || event.target.closest('button,a,input,select'))return;
    if(!floating){const initial=bounds();float();if(mode!=='move')apply(initial);}
    if(maximized)return;
    focus();event.preventDefault();
    interaction={mode,x:event.clientX,y:event.clientY,start:bounds(),target:event.currentTarget,id:event.pointerId};
    event.currentTarget.setPointerCapture(event.pointerId);panel.classList.add('window-interacting');
  }
  function end() {
    if(interaction){try{interaction.target.releasePointerCapture(interaction.id);}catch{}interaction=null;}
    panel.classList.remove('window-interacting');
  }
  function motion(event) {
    if(!interaction || event.pointerId!==interaction.id)return;
    const {start,x,y,mode}=interaction;
    apply(mode==='move'?moveWindow(start,event.clientX-x,event.clientY-y,viewport()):resizeWindow(start,event.clientX-x,event.clientY-y,viewport(),minimum,mode));
  }
  titlebar.addEventListener('pointerdown',event=>begin(event,'move'));
  for(const handle of handles)handle.addEventListener('pointerdown',event=>begin(event,handle.dataset.windowResize));
  for(const handle of [titlebar,...handles]){
    handle.addEventListener('pointermove',motion);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
    handle.addEventListener('keydown',event=>{
      if(event.target!==handle)return;
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();if(!floating)float();if(maximized)return;
      const step=event.shiftKey?32:8,dx=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,dy=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0;
      apply(handle!==titlebar?resizeWindow(bounds(),dx,dy,viewport(),minimum,handle.dataset.windowResize):moveWindow(bounds(),dx,dy,viewport()));
    });
  }
  panel.addEventListener('pointerdown',focus);
  toggle?.addEventListener('click',()=>floating?dock():float());
  panel.querySelector('[data-window-maximize]')?.addEventListener('click',maximize);
  panel.querySelector('[data-window-minimize]')?.addEventListener('click',()=>{
    end();
    if(panel.classList.contains('window-minimized'))restoreMinimized();
    else{const {width,height}=bounds();minimizedSize={width,height};panel.classList.add('window-minimized');}
    onMinimize(panel.classList.contains('window-minimized'));
  });
  panel.querySelector('[data-window-close]')?.addEventListener('click',()=>{end();panel.hidden=true;onClose();});
  window.addEventListener('resize',()=>{if(floating)apply(maximized?{x:0,y:48,width:window.innerWidth,height:window.innerHeight-48}:bounds());});
  return { float,dock,show(){panel.hidden=false;restoreMinimized();float();focus();},close(){end();panel.hidden=true;onClose();} };
}

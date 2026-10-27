export function fitWindow(rect, viewport, minimum = { width:320, height:260 }) {
  const width = Math.min(Math.max(minimum.width, rect.width), viewport.width);
  const height = Math.min(Math.max(minimum.height, rect.height), viewport.height-(viewport.top || 0));
  return { width, height, x:Math.max(0,Math.min(rect.x,viewport.width-width)), y:Math.max(viewport.top || 0,Math.min(rect.y,viewport.height-height)) };
}
export function moveWindow(start, dx, dy, viewport) {
  return fitWindow({ ...start,x:start.x+dx,y:start.y+dy },viewport);
}
export function resizeWindow(start, dx, dy, viewport, minimum = {width:320,height:260}, edge = 'se') {
  const r=fitWindow(start,viewport,minimum),right=r.x+r.width,bottom=r.y+r.height;
  const minWidth=Math.min(minimum.width,viewport.width),minHeight=Math.min(minimum.height,viewport.height-(viewport.top || 0));
  const clamp=(value,low,high)=>Math.max(low,Math.min(value,high));
  if(edge.includes('e'))r.width=clamp(r.width+dx,minWidth,viewport.width-r.x);
  if(edge.includes('s'))r.height=clamp(r.height+dy,minHeight,viewport.height-r.y);
  if(edge.includes('w')){r.x=clamp(r.x+dx,0,right-minWidth);r.width=right-r.x;}
  if(edge.includes('n')){r.y=clamp(r.y+dy,viewport.top || 0,bottom-minHeight);r.height=bottom-r.y;}
  return r;
}

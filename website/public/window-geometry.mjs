export function fitWindow(rect, viewport, minimum = { width:320, height:260 }) {
  const width = Math.min(Math.max(minimum.width, rect.width), viewport.width);
  const height = Math.min(Math.max(minimum.height, rect.height), viewport.height-(viewport.top || 0));
  return { width, height, x:Math.max(0,Math.min(rect.x,viewport.width-width)), y:Math.max(viewport.top || 0,Math.min(rect.y,viewport.height-height)) };
}
export function moveWindow(start, dx, dy, viewport) {
  return fitWindow({ ...start,x:start.x+dx,y:start.y+dy },viewport);
}
export function resizeWindow(start, dx, dy, viewport, minimum) {
  return fitWindow({ ...start,width:start.width+dx,height:start.height+dy },viewport,minimum);
}

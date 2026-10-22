const videoPattern=/^[\w-]{11}$/;
export function youtubeVideo(input) {
  const value=String(input || '').trim();
  if(videoPattern.test(value))return {id:value,start:0};
  let url;
  try{url=new URL(/^https?:\/\//i.test(value)?value:'https://'+value);}catch{throw new Error('Paste a YouTube video link or its 11-character video ID.');}
  if(!['https:','http:'].includes(url.protocol) || url.username || url.password)throw new Error('Use a YouTube video link.');
  const host=url.hostname.toLowerCase();let id;
  if(host==='youtu.be')id=url.pathname.split('/')[1];
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
    const parts=url.pathname.split('/').filter(Boolean);
    id=parts[0]==='watch'?url.searchParams.get('v'):['embed','shorts','live'].includes(parts[0])?parts[1]:null;
  }
  if(!videoPattern.test(id || ''))throw new Error('That link does not contain a valid YouTube video ID. Paste a watch, Shorts, live, embed, or youtu.be video link.');
  const raw=url.searchParams.get('t') || url.searchParams.get('start') || '';
  const time=/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw);
  const start=/^\d+$/.test(raw)?Number(raw):time?Number(time[1]||0)*3600+Number(time[2]||0)*60+Number(time[3]||0):0;
  return {id,start:Math.min(start,86400)};
}
export function youtubeEmbed(video, origin) {
  const url=new URL('https://www.youtube-nocookie.com/embed/'+video.id);
  url.search=new URLSearchParams({enablejsapi:'1',origin,playsinline:'1',rel:'0',start:String(video.start),autoplay:'0'});
  return url.href;
}
export function youtubeError(code) {
  return ({2:'YouTube rejected the video link.',5:'YouTube could not play this video in this browser.',100:'This video was removed, is private, or is unavailable.',101:'The owner does not allow this video to play on other websites.',150:'The owner does not allow this video to play on other websites.',153:'YouTube could not identify this website. Try the player in a regular site tab, or open the video on YouTube.'})[code] || 'YouTube could not play this video. The video or your network may restrict embedded playback.';
}

import { floatingWindow } from './floating-window.mjs';
import { youtubeVideo, youtubeEmbed, youtubeError } from './youtube-url.mjs';
import { recordNavigation } from './member-activity.mjs';
let apiPromise;
function youtubeApi() {
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(apiPromise)return apiPromise;
  apiPromise=new Promise((resolve,reject)=>{
    const prior=window.onYouTubeIframeAPIReady;
    const timer=setTimeout(()=>reject(new Error('YouTube controls could not connect. You can still try the controls inside the video frame or open the original video.')),15000);
    window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);try{prior?.();}finally{resolve(window.YT);}};
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
    script.referrerPolicy='strict-origin-when-cross-origin';
    script.onerror=()=>{clearTimeout(timer);reject(new Error('YouTube is blocked or unavailable on this connection. Try Open on YouTube.'));};
    document.head.append(script);
  }).catch(error=>{apiPromise=null;throw error;});
  return apiPromise;
}
export function initWorkspaceWindows({ currentUrl }) {
  const $=id=>document.getElementById(id);
  const browserWindow=floatingWindow($('workspace'),{minimum:{width:360,height:320}});
  const panel=$('youtube-panel');let player,sequence=0,loadTimer;
  const status=message=>{$('youtube-status').textContent=message;};
  function stop() {
    sequence++;clearTimeout(loadTimer);try{player?.destroy();}catch{}player=null;
    $('youtube-video').replaceChildren();status('Paste a video link to start.');
  }
  const youtubeWindow=floatingWindow(panel,{minimum:{width:360,height:460},onClose:stop,onMinimize:minimized=>{if(minimized)try{player?.pauseVideo();}catch{}}});
  function open(value='') {
    youtubeWindow.show();
    if(value){$('youtube-url').value=value;load(value);}else $('youtube-url').focus();
  }
  async function load(value) {
    let video;
    try{video=youtubeVideo(value);}catch(error){status(error.message);return;}
    stop();const revision=sequence;
    const original=new URL('https://www.youtube.com/watch');original.searchParams.set('v',video.id);if(video.start)original.searchParams.set('t',String(video.start));
    $('youtube-original').href=original.href;$('youtube-original').hidden=false;
    recordNavigation(original.href);
    status('Connecting to YouTube… Press Play in the video when it is ready.');
    const iframe=document.createElement('iframe');iframe.id='youtube-embed';iframe.title='YouTube video player';
    iframe.setAttribute('credentialless','');
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
    iframe.allowFullscreen=true;iframe.src=youtubeEmbed(video,location.origin);
    $('youtube-video').replaceChildren(iframe);
    loadTimer=setTimeout(()=>{if(sequence===revision)status('YouTube is taking longer than expected. If no player appears, your network or browser may block YouTube embeds. Try Open on YouTube.');},20000);
    try{
      const YT=await youtubeApi();if(sequence!==revision)return;
      player=new YT.Player(iframe,{events:{
        onReady:()=>{if(sequence!==revision)return;clearTimeout(loadTimer);status('Ready. Press Play inside the video.');},
        onStateChange:event=>{if(sequence!==revision)return;if(event.data===1){clearTimeout(loadTimer);status('Playing directly from YouTube.');}else if(event.data===2)status('Paused.');else if(event.data===0)status('Video ended. Paste another link to keep watching.');},
        onError:event=>{if(sequence!==revision)return;clearTimeout(loadTimer);status(youtubeError(event.data));},
        onAutoplayBlocked:()=>{if(sequence===revision)status('Your browser requires a click. Press Play inside the video.');},
      }});
    }catch(error){if(sequence===revision){clearTimeout(loadTimer);status(error.message);}}
  }
  for(const button of document.querySelectorAll('[data-youtube-open]'))button.addEventListener('click',()=>open());
  $('youtube-current').addEventListener('click',()=>open(currentUrl() || $('address').value));
  $('youtube-form').addEventListener('submit',event=>{event.preventDefault();load($('youtube-url').value);});
  $('youtube-retry').addEventListener('click',()=>load($('youtube-url').value));
  $('youtube-search-form').addEventListener('submit',event=>{
    event.preventDefault();const query=$('youtube-search').value.trim();if(!query)return;
    const url=new URL('https://www.youtube.com/results');url.searchParams.set('search_query',query);
    recordNavigation(url.href);window.open(url.href,'_blank','noopener,noreferrer');
  });
  $('reset-windows').addEventListener('click',()=>{browserWindow.dock();if(!panel.hidden){youtubeWindow.dock();youtubeWindow.float();}status('Window layout reset. Playback is preserved.');});
  window.addEventListener('pagehide',stop);
  const requested=new URL(location.href).searchParams.get('youtube');if(requested)open(requested);
  return {closePlayers:()=>youtubeWindow.close()};
}

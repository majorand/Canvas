import { floatingWindow } from './floating-window.mjs';
import { youtubeVideo, youtubeEmbed, youtubeError } from './youtube-url.mjs';
import { recordNavigation } from './member-activity.mjs';
import { accountApi } from './auth-client.mjs';
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
  const panel=$('youtube-panel');let player,sequence=0,loadTimer,searchSequence=0;
  const status=message=>{$('youtube-status').textContent=message;};
  function stop() {
    sequence++;clearTimeout(loadTimer);try{player?.destroy();}catch{}player=null;
    $('youtube-play').disabled=true;$('youtube-pause').disabled=true;
    $('youtube-video').replaceChildren();status('Paste a video link to start.');
  }
  const youtubeWindow=floatingWindow(panel,{minimum:{width:360,height:460},onClose:()=>{searchSequence++;stop();},onMinimize:minimized=>{if(minimized)try{player?.pauseVideo();}catch{}}});
  function open(value='') {
    youtubeWindow.show();
    if(value){$('youtube-url').value=value;load(value);}else $('youtube-url').focus();
  }
  async function load(value,{exclude=[],resume}={}) {
    let video;
    try{video=youtubeVideo(value);}catch(error){status(error.message);return;}
    if(Number.isFinite(resume))video.start=Math.floor(resume);
    stop();const revision=sequence;
    const original=new URL('https://www.youtube.com/watch');original.searchParams.set('v',video.id);if(video.start)original.searchParams.set('t',String(video.start));
    $('youtube-original').href=original.href;$('youtube-original').hidden=false;
    recordNavigation(original.href);
    $('youtube-attempts').replaceChildren();
    status('Looking for a playable video through public Invidious and Piped APIs…');
    const failures=[...exclude],deadline=Date.now()+45000;
    try {
      for(let attempt=0;attempt<3 && sequence===revision && Date.now()<deadline;attempt++){
        const result=await accountApi('video-resolve',{id:video.id,exclude:failures});
        if(sequence!==revision)return;
        for(const item of result.attempts || [])addAttempt(item.provider+' — '+item.status);
        if(!result.sources?.length)break;
        failures.push(result.provider);
        for(const source of result.sources.slice(0,2)){
          if(sequence!==revision)return;
          if(Date.now()>=deadline)break;
          status('Loading '+source.quality+' via '+result.provider+'…');
          try {await nativeVideo(source,video,result.provider,revision,()=>load(value,{exclude:failures,resume:$('youtube-media')?.currentTime}));if(sequence===revision)return;}
          catch(error){if(sequence!==revision)return;addAttempt(result.provider+' — media could not load ('+source.quality+')');}
        }
      }
    }catch(error){if(sequence!==revision)return;addAttempt(error.message);if(error.status===401 || error.status===403){status('Your workspace access ended. Sign in again to use the player.');return;}}
    if(sequence!==revision)return;
    addAttempt('No alternative API supplied a playable stream. Trying the official embed last.');
    embed(video,revision);
  }
  function addAttempt(message){const item=document.createElement('li');item.textContent=message;$('youtube-attempts').append(item);}
  function nativeVideo(source,video,provider,revision,onFailure) {
    return new Promise((resolve,reject)=>{
      const media=document.createElement('video');media.id='youtube-media';media.controls=true;media.playsInline=true;media.preload='auto';media.crossOrigin='anonymous';
      media.setAttribute('aria-label','Video through '+provider);
      if(!media.canPlayType(source.type)){reject(new Error('Unsupported format'));return;}
      let ready=false,done=false;
      const timer=setTimeout(()=>fail(),12000);
      const fail=()=>{if(done || sequence!==revision)return;done=true;clearTimeout(timer);media.pause();media.removeAttribute('src');media.load();reject(new Error('Media unavailable'));};
      player?.destroy();
      player={playVideo:()=>media.play().catch(()=>status('Press Play inside the video to start.')),pauseVideo:()=>media.pause(),destroy:()=>{done=true;clearTimeout(timer);media.pause();media.removeAttribute('src');media.load();reject(new Error('Playback cancelled'));}};
      media.addEventListener('loadeddata',()=>{
        if(sequence!==revision || done)return;ready=true;clearTimeout(timer);
        if(video.start)media.currentTime=video.start;
        $('youtube-play').disabled=false;$('youtube-pause').disabled=false;
        status('Ready via '+provider+'. Press Play to watch.');resolve();
      },{once:true});
      media.addEventListener('error',()=>{if(sequence!==revision || done)return;if(!ready)fail();else{done=true;onFailure();}});
      media.addEventListener('playing',()=>{if(sequence===revision)status('Playing via '+provider+'.');});
      media.addEventListener('pause',()=>{if(sequence===revision && !done)status('Paused · '+provider);});
      media.addEventListener('ended',()=>{if(sequence===revision)status('Video ended · '+provider);});
      $('youtube-video').replaceChildren(media);media.src=source.url;media.load();
    });
  }
  async function embed(video,revision) {
    try{player?.destroy();}catch{}player=null;
    status('Alternative APIs unavailable. Trying the official YouTube privacy-enhanced embed as the last fallback.');
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
        onReady:()=>{if(sequence!==revision)return;clearTimeout(loadTimer);$('youtube-play').disabled=false;$('youtube-pause').disabled=false;status('Official embed fallback ready. Press Play. If YouTube requests bot verification, this fallback cannot play either.');},
        onStateChange:event=>{if(sequence!==revision)return;if(event.data===1){clearTimeout(loadTimer);status('Playing through the official YouTube embed fallback.');}else if(event.data===2)status('Paused · official YouTube fallback.');else if(event.data===0)status('Video ended. Paste another link to keep watching.');},
        onError:event=>{if(sequence!==revision)return;clearTimeout(loadTimer);status(youtubeError(event.data));},
        onAutoplayBlocked:()=>{if(sequence===revision)status('Your browser requires a click. Press Play inside the video.');},
      }});
    }catch(error){if(sequence===revision){clearTimeout(loadTimer);status(error.message);}}
  }
  for(const button of document.querySelectorAll('[data-youtube-open]'))button.addEventListener('click',()=>open());
  $('youtube-current').addEventListener('click',()=>open(currentUrl() || $('address').value));
  $('youtube-form').addEventListener('submit',event=>{event.preventDefault();load($('youtube-url').value);});
  $('youtube-retry').addEventListener('click',()=>load($('youtube-url').value));
  $('youtube-play').addEventListener('click',()=>{try{player?.playVideo();}catch{status('The player could not resume. Try Retry video.');}});
  $('youtube-pause').addEventListener('click',()=>{try{player?.pauseVideo();}catch{status('The player could not pause. Close the panel to stop playback.');}});
  $('youtube-search-form').addEventListener('submit',async event=>{
    event.preventDefault();const query=$('youtube-search').value.trim();if(!query)return;
    const url=new URL('https://www.youtube.com/results');url.searchParams.set('search_query',query);
    recordNavigation(url.href);$('youtube-search-original').href=url.href;
    const revision=++searchSequence;$('youtube-search-status').textContent='Searching public video APIs…';$('youtube-search-results').replaceChildren();
    try{
      const result=await accountApi('video-search',{query});if(revision!==searchSequence || panel.hidden)return;
      $('youtube-search-status').textContent=result.fallback?'Public search APIs are unavailable. Paste a video link above, or use Search on YouTube.':result.items.length?'Results via '+result.provider:'No videos found. Try a different search.';
      for(const item of result.items){const button=document.createElement('button');button.type='button';button.className='youtube-result';button.textContent=item.title+(item.author?' · '+item.author:'');button.addEventListener('click',()=>{$('youtube-url').value=item.id;load(item.id);});$('youtube-search-results').append(button);}
    }catch(error){if(revision===searchSequence)$('youtube-search-status').textContent=error.message;}
  });
  $('reset-windows').addEventListener('click',()=>{browserWindow.dock();if(!panel.hidden){youtubeWindow.dock();youtubeWindow.float();}status('Window layout reset. Playback is preserved.');});
  window.addEventListener('pagehide',stop);
  const requested=new URL(location.href).searchParams.get('youtube');if(requested)open(requested);
  return {closePlayers:()=>youtubeWindow.close()};
}

const validId=/^[\w-]{11}$/;
export function videoCard(input) {
  if(!input || !validId.test(input.id || ''))return null;
  return {id:input.id,title:String(input.title || 'YouTube video').slice(0,200),author:String(input.author || 'Video channel').slice(0,100),channelId:String(input.channelId || '').slice(0,80),published:String(input.published || '').slice(0,40)};
}
export function filterVideos(items,query) {
  const words=String(query || '').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(item=>words.every(word=>(item.title+' '+item.author).toLocaleLowerCase().includes(word)));
}
export function createVideoLibrary({document,api,onPlay,onBrowse=()=>{},recordSearch=()=>{}}) {
  const $=id=>document.getElementById(id);
  let items=[],channels=[],selected='all',loadedChannel='',request=0,view='feed',query='',source='',selectedVideo=null,external=null;
  const savedKey='canvas.video-watch-later.v1';
  let saved=[];try{saved=JSON.parse(localStorage.getItem(savedKey)||'[]').map(videoCard).filter(Boolean).slice(0,100);}catch{}
  const element=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=text;return node;};
  const cards=input=>(Array.isArray(input)?input:[]).map(videoCard).filter(Boolean);
  function toggle(item) {
    saved=saved.some(x=>x.id===item.id)?saved.filter(x=>x.id!==item.id):[item,...saved].slice(0,100);
    try{localStorage.setItem(savedKey,JSON.stringify(saved));}catch{$('youtube-search-status').textContent='This browser could not save your list. You can still watch videos.';}
    render();updateWatchLater();
  }
  function updateWatchLater(){
    const button=$('youtube-watch-save'),exists=Boolean(selectedVideo&&saved.some(x=>x.id===selectedVideo.id));
    button.disabled=!selectedVideo;button.textContent=exists?'Saved ✓':'＋ Watch later';button.setAttribute('aria-pressed',String(exists));
  }
  function render() {
    const active=view==='saved'?saved:items;
    const visible=external || (query?filterVideos(active,query):active);
    $('youtube-feed-title').textContent=query?'Search results':view==='saved'?'Watch later':selected==='all'?'Latest uploads':channels.find(x=>x.id===selected)?.title || 'Channel videos';
    $('youtube-feed-note').textContent=view==='saved'?'Saved in this browser only.':query?(external?'Results from public video search.':'Matches from loaded feed'):(source || 'Discover recent videos from selected channels.');
    $('youtube-feed-home').setAttribute('aria-pressed',String(view==='feed'));
    $('youtube-feed-saved').setAttribute('aria-pressed',String(view==='saved'));
    $('youtube-channels').hidden=view==='saved';
    const nodes=visible.map(item=>{
      const article=element('article','video-card');
      const play=element('button','video-card-play');play.type='button';play.setAttribute('aria-label','Watch '+item.title);play.addEventListener('click',()=>onPlay(item.id,item));
      const thumb=element('span','video-card-thumb');
      const image=element('img','');image.alt='';image.loading='lazy';image.decoding='async';image.referrerPolicy='no-referrer';image.src='https://i.ytimg.com/vi/'+item.id+'/hqdefault.jpg';image.addEventListener('error',()=>{image.hidden=true;});
      const icon=element('span','video-card-icon','▶');icon.setAttribute('aria-hidden','true');thumb.append(image,icon);
      play.append(thumb,element('span','video-card-title',item.title));
      const info=element('div','video-card-meta');info.append(element('span','video-card-channel',item.author));
      const date=new Date(item.published);if(item.published&&!Number.isNaN(date.getTime()))info.append(element('span','video-card-date',date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})));
      const exists=saved.some(x=>x.id===item.id),later=element('button','video-card-save',exists?'Saved ✓':'＋ Save');later.type='button';later.setAttribute('aria-label',(exists?'Remove from':'Save to')+' Watch later: '+item.title);later.setAttribute('aria-pressed',String(exists));later.addEventListener('click',()=>toggle(item));
      article.append(play,info,later);return article;
    });
    $('youtube-search-results').replaceChildren(...nodes);
    $('youtube-feed-empty').hidden=Boolean(nodes.length);
    $('youtube-feed-empty').textContent=view==='saved'?'Save a video to build your Watch later list.':query?'No matching videos in the loaded feed. Try another search or paste a video link.':'No videos are available yet. Refresh the feed or paste a video link.';
  }
  function channelButtons(){
    $('youtube-channels').replaceChildren(...[{id:'all',title:'All channels'},...channels].map(channel=>{
      const button=element('button','video-channel-pill',channel.title);button.type='button';button.setAttribute('aria-pressed',String(channel.id===selected));
      button.addEventListener('click',()=>{selected=channel.id;view='feed';query='';external=null;$('youtube-search').value='';items=[];showBrowse();channelButtons();fetchFeed(true);});return button;
    }));
  }
  function acceptFeed(result){
    items=cards(result.items);channels=(Array.isArray(result.channels)?result.channels:[]).filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string');loadedChannel=selected;
    source=result.source==='starter videos'?'Starter videos · live uploads are unavailable right now.':result.stale?'Recent uploads · showing a saved feed while the live feed is unavailable.':'Recent uploads from selected channels. This feed is not personalized by YouTube.';
    channelButtons();render();
  }
  async function fetchFeed(force=false) {
    if(loadedChannel===selected&&!force){render();$('youtube-search-status').textContent=items.length+' videos · choose one to watch here.';return;}
    const revision=++request;
    render();$('youtube-search-status').textContent='Loading videos…';$('youtube-feed-refresh').disabled=true;
    try {
      const result=await api('video-feed',{channel:selected});if(revision!==request)return;
      acceptFeed(result);$('youtube-search-status').textContent=result.message || (items.length?items.length+' videos · choose one to watch here.':'No videos returned. Try again shortly.');
    } catch(error){if(revision!==request)return;$('youtube-search-status').textContent=error.message || 'Could not load the feed. Try Refresh feed.';render();}
    finally{if(revision===request)$('youtube-feed-refresh').disabled=false;}
  }
  async function search(event) {
    event?.preventDefault();query=$('youtube-search').value.trim().slice(0,160);if(!query){show();return;}
    showBrowse();external=null;recordSearch(query);const revision=++request;
    $('youtube-feed-refresh').disabled=false;render();
    if(view==='saved'){$('youtube-feed-note').textContent='Matches from your Watch later list.';$('youtube-search-status').textContent='Search your saved videos.';return;}
    $('youtube-search-status').textContent='Searching… You can watch matching videos from the loaded feed now.';
    const feed=loadedChannel===selected?Promise.resolve():api('video-feed',{channel:selected}).then(result=>{if(revision===request)acceptFeed(result);}).catch(()=>{});
    try {
      const result=await api('video-search',{query});if(revision!==request)return;
      const found=cards(result.items);
      if(found.length){external=found;render();$('youtube-search-status').textContent=found.length+' results · choose a video to watch here.';}
      else{await feed;if(revision!==request)return;render();$('youtube-search-status').textContent='Public search is unavailable. Showing matches from the loaded feed.';}
    }catch(error){await feed;if(revision!==request)return;render();$('youtube-search-status').textContent=error.status===401||error.status===403?'Your access ended. Sign in again to search videos.':'Search is unavailable. Showing matches from the loaded feed.';}
  }
  function showBrowse(){try{onBrowse();}catch{}$('youtube-browse').hidden=false;$('youtube-watch').hidden=true;}
  function show(){request++;$('youtube-feed-refresh').disabled=false;view='feed';query='';external=null;$('youtube-search').value='';showBrowse();channelButtons();fetchFeed();}
  function watch(value,item){
    request++;$('youtube-feed-refresh').disabled=false;
    selectedVideo=videoCard(item)||videoCard({id:value,title:'YouTube video',author:'Opened from a video link'});
    $('youtube-browse').hidden=true;$('youtube-watch').hidden=false;
    $('youtube-watch-title').textContent=selectedVideo?.title || 'YouTube video';$('youtube-watch-author').textContent=selectedVideo?.author || 'Opened from a video link';updateWatchLater();
  }
  $('youtube-search-form').addEventListener('submit',search);
  $('youtube-feed-home').addEventListener('click',show);
  $('youtube-feed-saved').addEventListener('click',()=>{request++;view='saved';query='';external=null;$('youtube-search').value='';$('youtube-feed-refresh').disabled=false;showBrowse();render();$('youtube-search-status').textContent='Your saved list stays on this browser.';});
  $('youtube-feed-refresh').addEventListener('click',()=>{view='feed';query='';external=null;$('youtube-search').value='';showBrowse();fetchFeed(true);});
  $('youtube-back-feed').addEventListener('click',()=>{showBrowse();if(loadedChannel!==selected)fetchFeed();else render();});
  $('youtube-watch-save').addEventListener('click',()=>{if(selectedVideo)toggle(selectedVideo);});
  return {show,watch,search(queryValue){$('youtube-search').value=queryValue;return search();},cancel(){request++;$('youtube-feed-refresh').disabled=false;}};
}

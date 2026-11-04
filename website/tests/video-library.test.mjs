import test from 'node:test';
import assert from 'node:assert/strict';
import { createVideoLibrary,videoCard,filterVideos } from '../public/video-library.mjs';
import { tabDocument } from './fixtures/tab-dom.mjs';
const first={id:'M7lc1UVf-VE',title:'Build with Google',author:'Google for Developers',channelId:'google',published:'2026-11-03T12:00:00Z'};
const second={id:'aqz-KE-bpKQ',title:'A NASA journey',author:'NASA',channelId:'nasa',published:'2026-11-02T12:00:00Z'};
const feed={items:[first,second],channels:[{id:'google',title:'Google for Developers'},{id:'nasa',title:'NASA'}],source:'YouTube channel feeds'};
const tick=async()=>{for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));};
function fixture(api=async()=>feed){
  const {document,element}=tabDocument(),plays=[],browses=[];
  const find=document.getElementById;document.getElementById=id=>find(id)||element(id);
  const library=createVideoLibrary({document,api,onPlay:(...args)=>plays.push(args),onBrowse:()=>browses.push(true)});
  const click=node=>node.listeners.get('click')?.();
  return {library,document,element,plays,browses,click};
}
test('feed cards use safe text, fixed lazy thumbnail URLs and working selection',async()=>{
  const f=fixture(async()=>({...feed,items:[{...first,title:'<img onerror=alert(1)>',thumbnail:'javascript:alert(1)'}]}));
  f.library.show();await tick();const article=f.element('youtube-search-results').children[0],button=article.children[0],image=button.children[0].children[0];
  assert.equal(button.children[1].textContent,'<img onerror=alert(1)>');assert.equal(image.src,'https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg');assert.equal(image.loading,'lazy');
  image.listeners.get('error')();assert.equal(image.hidden,true);f.click(button);assert.equal(f.plays[0][0],first.id);assert.equal(f.element('youtube-channels').children.length,3);
});
test('search immediately shows matching loaded cards and keeps them when public search is unavailable',async()=>{
  let resolve;const f=fixture(action=>action==='video-feed'?Promise.resolve(feed):new Promise(done=>{resolve=done;}));
  f.library.show();await tick();const pending=f.library.search('nasa');assert.equal(f.element('youtube-search-results').children.length,1);assert.equal(f.element('youtube-feed-note').textContent,'Matches from loaded feed');
  resolve({items:[],fallback:true});await pending;assert.equal(f.element('youtube-search-results').children.length,1);assert.match(f.element('youtube-search-status').textContent,/unavailable/);
});
test('saving a remote search result preserves results and Watch later works without browser storage',async()=>{
  const found={id:'jNQXAC9IVRw',title:'Remote result',author:'A channel'};
  const f=fixture(async action=>action==='video-feed'?feed:{items:[found]});f.library.show();await tick();await f.library.search('remote');
  f.click(f.element('youtube-search-results').children[0].children[2]);assert.equal(f.element('youtube-search-results').children[0].children[0].children[1].textContent,'Remote result');
  f.click(f.element('youtube-feed-saved'));assert.equal(f.element('youtube-feed-title').textContent,'Watch later');assert.equal(f.element('youtube-search-results').children.length,1);
  f.click(f.element('youtube-search-results').children[0].children[2]);assert.equal(f.element('youtube-search-results').children.length,0);assert.equal(f.element('youtube-feed-empty').hidden,false);
});
test('closed or changed views ignore late feed and search responses',async()=>{
  let resolve;const f=fixture(()=>new Promise(done=>{resolve=done;}));f.library.show();f.library.cancel();resolve(feed);await tick();assert.equal(f.element('youtube-search-results').children.length,0);
  const pending=f.library.search('nasa');f.library.watch(first.id,first);resolve({items:[second]});await pending;assert.equal(f.element('youtube-watch').hidden,false);assert.equal(f.element('youtube-search-results').children.length,0);
});
test('home restores the refresh control when a pending refresh is abandoned',async()=>{
  let resolve,calls=0;const f=fixture(()=>++calls===1?Promise.resolve(feed):new Promise(done=>{resolve=done;}));f.library.show();await tick();f.click(f.element('youtube-feed-refresh'));assert.equal(f.element('youtube-feed-refresh').disabled,true);
  f.click(f.element('youtube-feed-home'));assert.equal(f.element('youtube-feed-refresh').disabled,false);resolve(feed);await tick();assert.equal(f.element('youtube-feed-refresh').disabled,false);
});
test('card parsing rejects invalid IDs and filtering matches all title and channel words',()=>{
  assert.equal(videoCard({id:'bad/<script>'}),null);assert.equal(filterVideos([first,second],'google build').length,1);assert.equal(filterVideos([first,second],'nasa google').length,0);
});

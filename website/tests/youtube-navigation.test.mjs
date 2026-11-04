import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeDestination} from '../public/youtube-url.mjs';
test('routes video timestamps, YouTube pages, relative links and Google redirects without matching spoofed hosts',()=>{
 const id='M7lc1UVf-VE';
 assert.deepEqual(youtubeDestination('https://youtu.be/'+id+'?t=45').video,{id,start:45});
 assert.equal(youtubeDestination('/watch?v='+id,'https://www.youtube.com/').video.id,id);
 assert.equal(youtubeDestination('https://www.youtube.com/results?search_query=space').query,'space');
 assert.equal(youtubeDestination('https://www.youtube.com/').video,null);
 assert.equal(youtubeDestination('https://www.google.com/url?q='+encodeURIComponent('https://youtu.be/'+id)).video.id,id);
 for(const value of ['https://youtube.com.evil.test/watch?v='+id,'javascript:alert(1)','https://user:secret@youtube.com/watch?v='+id,'https://google.com/url?q='+encodeURIComponent('javascript:alert(1)'),'https://example.com/'])assert.equal(youtubeDestination(value),null);
});

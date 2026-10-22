import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function client(fetch) {
  const source=(await readFile(new URL('../public/auth-client.mjs',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
  let deadline;
  const context=vm.createContext({fetch,URL,Date,JSON,Error,window:{SCRAMJET_CONFIG:{api:'https://backend.example/api/access'}},sessionStorage:{getItem(){return null;}},AbortSignal:{timeout(ms){deadline=ms;return 'signal';}},appUrl:file=>new URL(file,'https://frontend.example/'),location:{replace(){}}});
  vm.runInContext(source,context);
  return {api:vm.runInContext('accountApi',context),deadline:()=>deadline};
}

test('account requests allow free-host wakeup and retain authentication without replaying mutations',async()=>{
  const requests=[];
  const fixture=await client(async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({message:'ok'})};});
  await fixture.api('password',{password:'fixture-only-password'},'fixture-session');
  assert.equal(fixture.deadline(),90000);
  assert.equal(requests.length,1);
  assert.equal(requests[0].options.headers.Authorization,'Bearer fixture-session');
  assert.equal(requests[0].options.credentials,'omit');
  assert.equal(JSON.parse(requests[0].options.body).action,'password');
});

test('network failures and wakeup timeouts give recovery guidance and never replay a login',async()=>{
  for(const [name,message] of [['TypeError',/Could not connect to the account server/],['TimeoutError',/Wait a minute/]]){
    let count=0;
    const fixture=await client(async()=>{count++;const error=new Error('private transport details');error.name=name;throw error;});
    await assert.rejects(fixture.api('login',{},''),message);
    assert.equal(count,1);
  }
});

test('account rejection preserves its status so expired sessions still redirect correctly',async()=>{
  let count=0;
  const fixture=await client(async()=>{count++;return {ok:false,status:401,json:async()=>({error:'Session ended.'})};});
  await assert.rejects(fixture.api('me'),error=>error.status===401 && error.message==='Session ended.');
  assert.equal(count,1);
});

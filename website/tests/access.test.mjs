import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccessService, AccessError, digest, authorizeRelay } from '../lib/access.mjs';
import { createAccessHandler } from '../api/access.js';
import { fakeSupabase } from './fixtures/fake-supabase.mjs';
import { createAppServer } from '../server.mjs';
import { createUpgrade } from '../lib/relay.mjs';
import WebSocket from 'ws';

async function fixture() {
  const fake = fakeSupabase();
  const service = createAccessService({ ...fake, ownerEmail:'owner@example.test',siteUrl:'https://example.test/' });
  await service.dispatch('setup', {email:'owner@example.test'}, '', '1');
  const owner = [...fake.identities.values()][0];
  await service.dispatch('complete-setup', {accessToken:owner.id,password:'owner-test-password-123'}, '', '1');
  const admin = await service.dispatch('login',{email:owner.email,password:'owner-test-password-123',admin:true},'', '1');
  await service.dispatch('create-user',{email:'member@example.test',name:'Test member',password:'member-test-password-123'},admin.token,'1');
  const member = await service.dispatch('login',{email:'member@example.test',password:'member-test-password-123'},'', '2');
  return {fake,service,admin,member};
}
const rejected = (promise,status) => assert.rejects(promise,error => error instanceof AccessError && error.status === status);

test('owner setup requires a verified owner link and cannot be repeated', async () => {
  const fake=fakeSupabase();
  const service=createAccessService({...fake,ownerEmail:'owner@example.test',siteUrl:'https://example.test/'});
  await service.dispatch('setup',{email:'attacker@example.test'},'','1');
  assert.equal(fake.identities.size,0);
  await service.dispatch('setup',{email:'owner@example.test'},'','2');
  await rejected(service.dispatch('complete-setup',{accessToken:'invalid',password:'test-password-long'},'','1'),401);
  const owner=[...fake.identities.values()][0];
  await service.dispatch('complete-setup',{accessToken:owner.id,password:'test-password-long'},'','1');
  await rejected(service.dispatch('complete-setup',{accessToken:owner.id,password:'test-password-other'},'','1'),409);
  assert.equal((await service.dispatch('status',{},'','1')).setupAvailable,false);
});

test('member, admin, and relay credentials cannot substitute for each other', async () => {
  const {service,admin,member,fake}=await fixture();
  await rejected(service.dispatch('admin-data',{},member.token,'2'),401);
  await rejected(service.dispatch('relay',{},admin.token,'1'),401);
  await rejected(service.dispatch('login',{email:'member@example.test',password:'member-test-password-123',admin:true},'','2'),403);
  const relay=await service.dispatch('relay',{},member.token,'2');
  await service.authorize(relay.token,'relay');
  await rejected(service.dispatch('me',{},relay.token,'2'),401);
  assert.ok(fake.tables.site_sessions.every(row => row.token_hash !== member.token && row.token_hash !== admin.token && row.token_hash !== relay.token));
  assert.ok(fake.tables.site_sessions.some(row => row.token_hash === digest(member.token)));
});

test('disabled accounts and reset passwords revoke existing sessions and relay credentials', async () => {
  const {service,admin,member}=await fixture();
  const relay=await service.dispatch('relay',{},member.token,'2');
  await service.dispatch('update-user',{id:member.user.id,enabled:false},admin.token,'1');
  await rejected(service.authorize(member.token,'member'),401);
  await rejected(service.authorize(relay.token,'relay'),401);
  await rejected(service.dispatch('login',{email:member.user.email,password:'member-test-password-123'},'','2'),403);
  await service.dispatch('update-user',{id:member.user.id,enabled:true,password:'new-member-password-123'},admin.token,'1');
  await rejected(service.dispatch('login',{email:member.user.email,password:'member-test-password-123'},'','2'),401);
  const newSession=await service.dispatch('login',{email:member.user.email,password:'new-member-password-123'},'','2');
  assert.ok(newSession.token);
});

test('signout cascades to relay credentials and sessions expire', async () => {
  const {service,member,fake}=await fixture();
  const relay=await service.dispatch('relay',{},member.token,'2');
  await service.dispatch('logout',{},member.token,'2');
  await rejected(service.authorize(relay.token,'relay'),401);
  const fresh=await service.dispatch('login',{email:member.user.email,password:'member-test-password-123'},'','2');
  fake.advance(4*3600000+1);
  await rejected(service.authorize(fresh.token,'member'),401);
});

test('own password change verifies the old password and logs contain no passwords or tokens', async () => {
  const {service,admin,member}=await fixture();
  await rejected(service.dispatch('password',{currentPassword:'wrong',password:'new-long-password-123'},member.token,'2'),401);
  await service.dispatch('enter',{},member.token,'2');
  await service.dispatch('password',{currentPassword:'member-test-password-123',password:'new-long-password-123'},member.token,'2');
  await rejected(service.authorize(member.token,'member'),401);
  const data=await service.dispatch('admin-data',{},admin.token,'1');
  assert.ok(data.events.some(event=>event.event==='workspace_open'&&event.email===member.user.email));
  const serialized=JSON.stringify(data);
  assert.ok(!serialized.includes(member.token));
  assert.ok(!serialized.includes('new-long-password-123'));
  assert.ok(!serialized.includes('password_hash'));
});

test('repeated login attempts are rate limited', async () => {
  const {service}=await fixture();
  for(let i=0;i<10;i++) await rejected(service.dispatch('login',{email:'unknown@example.test',password:'wrong'},'','3'),401);
  await rejected(service.dispatch('login',{email:'unknown@example.test',password:'wrong'},'','3'),429);
});

test('HTTP and WebSocket endpoints reject unauthorized requests and allow authenticated browsing', async () => {
  const {service,member,admin}=await fixture();
  const upgrade=createUpgrade(async req => {
    const token=new URL(req.url,'http://localhost').searchParams.get('ticket');
    const user=await service.authorize(token,'relay');
    return {expiresAt:user.expires_at,revalidate:()=>service.authorize(token,'relay')};
  });
  const server=createAppServer({apiHandler:createAccessHandler(()=>service),upgradeHandler:upgrade});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const post=(action,token,origin=base)=>fetch(base+'/api/access',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({action})});
  const handshake = async (token, expected) => new Promise((resolve,reject)=>{
    const ws=new WebSocket(base.replace('http:','ws:')+'/api/wisp/?ticket='+(token||''),{origin:base});
    const timer=setTimeout(()=>{ws.terminate();reject(Error('timeout'))},3000);
    ws.on('error',()=>{});
    ws.on('unexpected-response',(_req,res)=>{clearTimeout(timer);res.resume();ws.terminate();try{assert.equal(res.statusCode,expected);resolve();}catch(error){reject(error);}});
    ws.once('message',data=>{clearTimeout(timer);ws.close();try{assert.equal(expected,101);assert.ok([3,5].includes(data[0]));resolve();}catch(error){reject(error);}});
  });
  try {
    assert.equal((await post('me')).status,401);
    assert.equal((await post('admin-data',member.token)).status,401);
    assert.equal((await post('me',member.token,'https://attacker.example')).status,403);
    assert.equal((await post('me',member.token)).status,200);
    assert.equal((await post('admin-data',admin.token)).status,200);
    await handshake('',401); await handshake(member.token,401);
    const relay=await service.dispatch('relay',{},member.token,'2');
    await handshake(relay.token,101);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});

test('production relay rejects a missing credential before accessing any database', async () => {
  await rejected(authorizeRelay({url:'/api/wisp/'}),401);
});

test('username and email both sign in, share rate limits, and retain role checks', async () => {
  const {service,admin,member}=await fixture();
  await service.dispatch('update-user',{id:member.user.id,username:'  School.User  '},admin.token,'1');
  const login = await service.dispatch('login',{identifier:'SCHOOL.USER',password:'member-test-password-123'},'','4');
  assert.equal(login.user.id,member.user.id);
  assert.ok((await service.dispatch('login',{identifier:member.user.email,password:'member-test-password-123'},'','4')).token);
  await rejected(service.dispatch('login',{identifier:'school.user',password:'member-test-password-123',admin:true},'','4'),403);
  await rejected(service.dispatch('admin-profile',{username:'takeover'},member.token,'4'),401);
  await service.dispatch('update-user',{id:member.user.id,enabled:false},admin.token,'1');
  await rejected(service.dispatch('login',{identifier:'school.user',password:'member-test-password-123'},'','4'),403);
});

test('usernames are unique, validated, editable, optional, and supported for the administrator', async () => {
  const {service,admin,member}=await fixture();
  await service.dispatch('admin-profile',{username:'My.Admin'},admin.token,'1');
  assert.ok((await service.dispatch('login',{identifier:'my.admin',password:'owner-test-password-123',admin:true},'','7')).token);
  await rejected(service.dispatch('update-user',{id:member.user.id,username:'MY.ADMIN'},admin.token,'1'),409);
  await rejected(service.dispatch('create-user',{email:'new@example.test',username:'my.admin',name:'New',password:'new-test-password-123'},admin.token,'1'),409);
  for (const username of ['xy','has space','email@example.test','_invalid','x'.repeat(33)]) {
    await rejected(service.dispatch('update-user',{id:member.user.id,username},admin.token,'1'),400);
  }
  await service.dispatch('create-user',{email:'new@example.test',username:'new-user',name:'New',password:'new-test-password-123'},admin.token,'1');
  assert.ok((await service.dispatch('login',{identifier:'new-user',password:'new-test-password-123'},'','8')).token);
  await service.dispatch('update-user',{id:member.user.id,username:'old-name'},admin.token,'1');
  await service.dispatch('update-user',{id:member.user.id,username:'new-name'},admin.token,'1');
  await rejected(service.dispatch('login',{identifier:'old-name',password:'member-test-password-123'},'','9'),401);
  await service.dispatch('update-user',{id:member.user.id,username:''},admin.token,'1');
  await rejected(service.dispatch('login',{identifier:'new-name',password:'member-test-password-123'},'','9'),401);
  assert.ok((await service.dispatch('login',{email:member.user.email,password:'member-test-password-123'},'','9')).token);
});

test('alternating email and username cannot bypass account login throttling', async () => {
  const {service,admin,member}=await fixture();
  await service.dispatch('update-user',{id:member.user.id,username:'same-account'},admin.token,'1');
  for(let i=0;i<9;i++) await rejected(service.dispatch('login',{identifier:i%2?'same-account':member.user.email,password:'wrong'},'','new-ip'),401);
  await rejected(service.dispatch('login',{identifier:'same-account',password:'member-test-password-123'},'','different-ip'),429);
});

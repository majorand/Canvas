import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createAccessService, digest } from '../lib/access.mjs';
import { fakeSupabase } from './fixtures/fake-supabase.mjs';
import { activityFromUrl, sanitizeActivity, csvCell } from '../public/activity-details.mjs';
async function fixture() {
  const fake = fakeSupabase();
  const service = createAccessService({...fake,ownerEmail:'owner@example.test',siteUrl:'https://example.test/'});
  await service.dispatch('setup',{email:'owner@example.test'},'','1');
  const owner = [...fake.identities.values()][0];
  await service.dispatch('complete-setup',{accessToken:owner.id,password:'owner-test-password-123'},'','1');
  const admin = await service.dispatch('login',{email:owner.email,password:'owner-test-password-123',admin:true},'','1');
  await service.dispatch('create-user',{email:'member@example.test',name:'Member',password:'member-test-password-123'},admin.token,'1');
  const login = () => service.dispatch('login',{email:'member@example.test',password:'member-test-password-123'},'','2');
  const member = await login();
  return {fake,service,admin,member,login,call:(action,body={})=>service.dispatch(action,body,admin.token,'1'),memberCall:(action,body={})=>service.dispatch(action,body,member.token,'2')};
}
const rejects = (promise,status) => assert.rejects(promise,error=>error.status===status);

test('activity strips URL secrets, only extracts known submitted search parameters, and exports safe CSV', () => {
  assert.deepEqual(activityFromUrl('https://www.google.com/search?q=space+travel&token=secret#private'),{kind:'search',domain:'www.google.com',query:'space travel'});
  assert.deepEqual(activityFromUrl('https://private.example/reset?password=secret&token=key#fragment'),{kind:'visit',domain:'private.example',query:''});
  assert.equal(activityFromUrl('https://user:secret@example.com/'),null);
  assert.equal(activityFromUrl('javascript:alert(1)'),null);
  assert.equal(activityFromUrl('https://www.google.com/login?q=private').query,'');
  assert.equal(activityFromUrl('https://www.youtube.com/results?search_query=music').query,'music');
  assert.equal(sanitizeActivity({kind:'search',domain:'attacker.test',query:'secret'}).query,'');
  assert.equal(sanitizeActivity({domain:'example.com/?token=secret'}),null);
  assert.equal(sanitizeActivity({kind:'search',domain:'bing.com',query:'x'.repeat(200)}).query.length,160);
  assert.equal(csvCell('=HYPERLINK("bad")'),'"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCell('\t+formula'),'"\'\t+formula"');
});

test('members cannot read dashboard activity, edit settings or permissions, or revoke sessions', async () => {
  const {memberCall} = await fixture();
  for (const action of ['admin-data','admin-settings','update-user','revoke-session','revoke-user-sessions','revoke-member-sessions']) await rejects(memberCall(action),401);
});

test('sessions and tabs are counted separately, stale tabs age out, and revocation cascades to relay and tabs', async () => {
  const {fake,service,member,call,memberCall} = await fixture();
  const tabId = randomUUID();
  await memberCall('enter',{tabId,feature:'workspace'});
  await memberCall('presence',{tabId,feature:'workspace',visible:false});
  await memberCall('presence',{tabId:randomUUID(),feature:'games'});
  const relay = await memberCall('relay');
  let data = await call('admin-data');
  assert.equal(data.stats.sessions,1); assert.equal(data.stats.active_tabs,2); assert.equal(data.stats.online_accounts,1);
  const serialized=JSON.stringify(data);
  for (const secret of [member.token,digest(member.token),relay.token,digest(relay.token),'token_hash','session_hash']) assert.ok(!serialized.includes(secret));
  fake.advance(121000); data = await call('admin-data');
  assert.equal(data.stats.active_tabs,0); assert.equal(data.stats.sessions,1);
  await call('revoke-session',{id:data.sessions[0].id});
  await rejects(service.authorize(relay.token,'relay'),401); await rejects(memberCall('me'),401);
  assert.equal(fake.tables.site_workspace_tabs.length,0);
  assert.equal((await call('admin-data')).stats.sessions,0);
});

test('activity is scoped to authenticated account, sanitized server-side, rate limited, and can be stopped', async () => {
  const {fake,member,call,memberCall} = await fixture();
  await memberCall('activity',{kind:'search',domain:'google.com',query:'test search',user_id:'forged',url:'https://private.example/?secret=key'});
  const record=fake.tables.site_activity[0];
  assert.equal(record.user_id,member.user.id); assert.equal(record.query,'test search'); assert.equal(record.url,undefined);
  let data = await call('admin-data');
  assert.equal(data.stats.searches_today,1);
  await call('admin-settings',{...data.settings,activity_logging:false});
  await memberCall('activity',{kind:'search',domain:'google.com',query:'not recorded'});
  assert.equal(fake.tables.site_activity.length,1);
  assert.equal((await memberCall('presence')).settings.activity_logging,false);
  await call('admin-settings',{...data.settings,activity_logging:true});
  for(let i=1;i<60;i++) await memberCall('activity',{kind:'visit',domain:'example.com'});
  await rejects(memberCall('activity',{kind:'visit',domain:'example.com'}),429);
});

test('workspace, games, expiry, and maintenance permissions are enforced while owner stays available', async () => {
  const {fake,service,admin,member,call,memberCall,login} = await fixture();
  const relay = await memberCall('relay');
  await call('update-user',{id:member.user.id,can_browse:false,can_play:false});
  await rejects(memberCall('relay'),403); await rejects(service.authorize(relay.token,'relay'),401);
  await rejects(memberCall('feature',{feature:'workspace'}),403); await rejects(memberCall('feature',{feature:'games'}),403);
  assert.ok((await memberCall('me')).user); // Password management remains available.
  await call('update-user',{id:member.user.id,can_browse:true,can_play:true});
  const config = (await call('admin-data')).settings;
  await call('admin-settings',{...config,games_enabled:false}); await rejects(memberCall('feature',{feature:'games'}),403);
  await memberCall('relay');
  await call('admin-settings',{...config,maintenance_enabled:true});
  await rejects(login(),403); await rejects(memberCall('presence'),403); await rejects(service.authorize(relay.token,'relay'),401);
  await call('admin-settings',{...config,maintenance_enabled:false});
  await call('update-user',{id:member.user.id,access_expires_at:new Date(fake.now()+1000).toISOString()});
  fake.advance(1001); await rejects(memberCall('me'),401); await rejects(login(),403);
  await rejects(call('update-user',{id:admin.user.id,enabled:false,can_browse:false}),403);
  await call('admin-data');
});

test('settings validate bounds, set new session lifetimes and limits, and bulk logout preserves admin', async () => {
  const {fake,member,call,login} = await fixture();
  const config = (await call('admin-data')).settings;
  for(const patch of [{retention_days:1},{session_hours:25},{session_limit:0},{games_enabled:'false'},{maintenance_message:''}]) await rejects(call('admin-settings',{...config,...patch}),400);
  await call('admin-settings',{...config,session_limit:1,session_hours:2});
  await rejects(login(),409);
  await call('revoke-user-sessions',{id:member.user.id});
  const fresh = await login(); assert.equal(new Date(fresh.expiresAt).getTime()-fake.now(),7200000);
  await call('revoke-member-sessions');
  assert.equal((await call('admin-data')).stats.sessions,0);
  assert.ok(fake.tables.site_access_events.some(e=>e.event==='site_settings_changed'));
  assert.ok(fake.tables.site_access_events.some(e=>e.event==='all_member_sessions_ended'));
});

test('browser activity deduplicates navigation, never sends full URLs, and closes tab with keepalive', async () => {
  const source = await readFile(new URL('../public/member-activity.mjs',import.meta.url),'utf8');
  const calls=[], listeners=new Map(), notices=[{textContent:''}]; let interval;
  const context=vm.createContext({console,Date,JSON,crypto:{randomUUID},activityFromUrl,
    document:{hidden:false,querySelectorAll:()=>notices,addEventListener:(name,cb)=>listeners.set(name,cb)},
    window:{addEventListener:(name,cb)=>listeners.set(name,cb)},
    setInterval:cb=>{interval=cb;return 1},clearInterval:()=>{},
    accountApi:async (...args)=>{calls.push(args);return {settings:{activity_logging:true,retention_days:14}}},
  });
  vm.runInContext(source.replace(/^import .*;\r?\n/gm,'').replaceAll('export function','function'),context);
  context.recordNavigation('https://www.google.com/search?q=space&token=private');
  context.recordNavigation('https://www.google.com/search?q=space&token=changed');
  assert.equal(calls.length,1); assert.ok(!JSON.stringify(calls).includes('private')); assert.ok(!JSON.stringify(calls).includes('token='));
  context.startPresence('workspace',error=>{throw error}); await new Promise(resolve=>setImmediate(resolve));
  await interval(); assert.equal(calls.at(-1)[0],'presence'); assert.ok(notices[0].textContent.includes('14 days'));
  listeners.get('pagehide')(); assert.equal(calls.at(-1)[0],'tab-close'); assert.equal(calls.at(-1)[3].keepalive,true);
  context.showActivityNotice({activity_logging:false});
  const before=calls.length; context.recordNavigation('https://example.com/'); assert.equal(calls.length,before);
});

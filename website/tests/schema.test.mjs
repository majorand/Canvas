import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { authorizedRelayUrl } from '../public/auth-client.mjs';

test('authenticated relay URL works with libcurl trailing-slash validation', async () => {
  const token = 'a'.repeat(64);
  const previous = { window:globalThis.window, fetch:globalThis.fetch, sessionStorage:globalThis.sessionStorage };
  globalThis.window = { SCRAMJET_CONFIG:{wisp:'wss://relay.example/api/wisp/',api:'https://relay.example/api/access'} };
  globalThis.sessionStorage = {getItem:()=>null};
  globalThis.fetch = async () => ({ok:true,json:async()=>({token,expiresAt:new Date(Date.now()+60000).toISOString()})});
  try {
    const address = await authorizedRelayUrl();
    assert.ok(address.endsWith('/'));
    assert.equal(new URL(address).searchParams.get('ticket'),token);
    assert.equal(new URL(address).pathname,'/api/wisp/');
  } finally {
    for (const [key,value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});

test('actual PostgreSQL schema restricts roles, limits attempts, and revokes relay sessions', async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);");
    const schema = await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8');
    await db.exec(schema);
    await db.exec(schema); // Safe to apply again without losing existing data.
    for (const role of ['anon','authenticated']) {
      await db.exec('set role '+role);
      await assert.rejects(db.query('select * from public.site_accounts'),/permission denied/);
      await assert.rejects(db.query("select public.site_authorize_session('x','member')"),/permission denied/);
      await db.exec('reset role');
    }
    const id = '11111111-1111-4111-8111-111111111111';
    await db.query('insert into auth.users values ($1)',[id]);
    await db.query("insert into public.site_accounts(id,email,display_name) values ($1,'member@example.test','Member')",[id]);
    await db.exec('set role service_role');
    await db.query("insert into public.site_sessions(token_hash,user_id,kind,expires_at) values ('member',$1,'member',now()+interval '1 hour')",[id]);
    await db.query("insert into public.site_sessions(token_hash,user_id,kind,parent_hash,expires_at) values ('relay',$1,'relay','member',now()+interval '1 hour')",[id]);
    const auth = async (hash,kind) => (await db.query('select public.site_authorize_session($1,$2) as result',[hash,kind])).rows[0].result;
    assert.equal((await auth('member','member')).id,id);
    assert.equal(await auth('member','admin'),null);
    assert.equal((await auth('relay','relay')).id,id);
    await db.query('update public.site_accounts set enabled=false where id=$1',[id]);
    assert.equal(await auth('relay','relay'),null);
    await db.query('update public.site_accounts set enabled=true where id=$1',[id]);
    await db.query("delete from public.site_sessions where token_hash='member'");
    assert.equal(await auth('relay','relay'),null);
    assert.equal((await db.query('select count(*)::integer as count from public.site_sessions')).rows[0].count,0);
    for (const expected of [true,true,false]) {
      assert.equal((await db.query("select public.site_allow_attempt('ip',2,60) as allowed")).rows[0].allowed,expected);
    }
    await db.query("update public.site_rate_limits set expires_at=now()-interval '1 second'");
    assert.equal((await db.query("select public.site_allow_attempt('ip',2,60) as allowed")).rows[0].allowed,true);
    await db.query("insert into public.site_access_events(email,event,created_at) values ('member@example.test','sign_in',now()-interval '31 days')");
    await db.query('select public.site_cleanup()');
    assert.equal((await db.query('select count(*)::integer as count from public.site_access_events')).rows[0].count,0);
  } finally { await db.close(); }
});

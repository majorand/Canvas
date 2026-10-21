-- Additive, repeatable migration. Existing accounts and credentials stay intact.
begin;
alter table public.site_accounts add column if not exists can_browse boolean not null default true;
alter table public.site_accounts add column if not exists can_play boolean not null default true;
alter table public.site_accounts add column if not exists access_expires_at timestamptz;
alter table public.site_sessions add column if not exists id uuid not null default gen_random_uuid() unique;

create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  activity_logging boolean not null default true,
  retention_days integer not null default 30 check (retention_days in (7,14,30)),
  games_enabled boolean not null default true,
  maintenance_enabled boolean not null default false,
  maintenance_message text not null default 'The workspace is temporarily paused. Please try again later.' check (length(maintenance_message) between 1 and 200),
  session_hours integer not null default 4 check (session_hours between 1 and 24),
  session_limit integer not null default 10 check (session_limit between 1 and 20)
);
insert into public.site_settings(id) values(true) on conflict do nothing;
create table if not exists public.site_activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.site_accounts(id) on delete cascade,
  kind text not null check (kind in ('search','visit')),
  domain text not null check (length(domain) between 1 and 253),
  query text not null default '' check (length(query) <= 160),
  created_at timestamptz not null default now()
);
create index if not exists site_activity_time on public.site_activity(created_at desc);
create table if not exists public.site_workspace_tabs (
  id uuid primary key,
  session_hash text not null references public.site_sessions(token_hash) on delete cascade,
  user_id uuid not null references public.site_accounts(id) on delete cascade,
  feature text not null check (feature in ('workspace','games')),
  visible boolean not null default true,
  last_seen_at timestamptz not null default now()
);
create index if not exists site_tabs_seen on public.site_workspace_tabs(last_seen_at desc);
alter table public.site_settings enable row level security;
alter table public.site_activity enable row level security;
alter table public.site_workspace_tabs enable row level security;
revoke all on public.site_settings, public.site_activity, public.site_workspace_tabs from public, anon, authenticated;
grant all on public.site_settings, public.site_activity, public.site_workspace_tabs to service_role;
grant usage, select on sequence public.site_activity_id_seq to service_role;

create or replace function public.site_authorize_session(p_hash text, p_kind text)
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object('id', a.id, 'email', a.email, 'display_name', a.display_name,
    'role', a.role, 'expires_at', s.expires_at, 'can_browse', a.can_browse, 'can_play', a.can_play)
  from public.site_sessions s join public.site_accounts a on a.id = s.user_id
  cross join public.site_settings config
  where s.token_hash = p_hash and s.kind = p_kind and s.expires_at > now()
    and a.enabled and a.activated
    and (a.role = 'admin' or a.access_expires_at is null or a.access_expires_at > now())
    and (p_kind <> 'admin' or a.role = 'admin')
    and (p_kind <> 'relay' or ((a.role = 'admin' or (a.can_browse and not config.maintenance_enabled)) and exists(
      select 1 from public.site_sessions parent where parent.token_hash = s.parent_hash
      and parent.kind = 'member' and parent.expires_at > now() and parent.user_id = a.id
    )))
  limit 1;
$$;

create or replace function public.site_touch_tab(p_hash text, p_id uuid, p_feature text, p_visible boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare member_id uuid;
begin
  select s.user_id into member_id from public.site_sessions s
    where s.token_hash=p_hash and s.kind='member' and s.expires_at>now();
  if member_id is null then raise exception 'invalid_session'; end if;
  insert into public.site_workspace_tabs(id,session_hash,user_id,feature,visible,last_seen_at)
    values(p_id,p_hash,member_id,p_feature,p_visible,now())
    on conflict(id) do update set feature=excluded.feature,visible=excluded.visible,last_seen_at=now()
    where site_workspace_tabs.session_hash=p_hash;
end; $$;

create or replace function public.site_session_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.kind='member' and exists(select 1 from public.site_accounts where id=new.user_id and role<>'admin') then
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
    if (select count(*) from public.site_sessions where user_id=new.user_id and kind='member' and expires_at>now())
      >= (select session_limit from public.site_settings where id) then
      raise exception 'session_limit';
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists site_session_limit on public.site_sessions;
create trigger site_session_limit before insert on public.site_sessions for each row execute function public.site_session_limit();

create or replace function public.site_admin_stats()
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'sessions',(select count(*) from public.site_sessions where kind='member' and expires_at>now()),
    'active_tabs',(select count(*) from public.site_workspace_tabs t join public.site_sessions s on s.token_hash=t.session_hash where t.last_seen_at>now()-interval '2 minutes' and s.expires_at>now()),
    'online_accounts',(select count(distinct t.user_id) from public.site_workspace_tabs t join public.site_sessions s on s.token_hash=t.session_hash where t.last_seen_at>now()-interval '2 minutes' and s.expires_at>now()),
    'searches_today',(select count(*) from public.site_activity where kind='search' and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')
  );
$$;
create or replace function public.site_cleanup()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.site_sessions where expires_at < now();
  delete from public.site_workspace_tabs where last_seen_at < now()-interval '1 day';
  delete from public.site_activity where created_at < now() - make_interval(days => (select retention_days from public.site_settings where id));
  delete from public.site_access_events where created_at < now() - interval '30 days';
  delete from public.site_rate_limits where expires_at < now();
end; $$;
revoke all on function public.site_touch_tab(text,uuid,text,boolean), public.site_session_limit(), public.site_admin_stats() from public, anon, authenticated;
grant execute on function public.site_touch_tab(text,uuid,text,boolean), public.site_admin_stats() to service_role;
commit;

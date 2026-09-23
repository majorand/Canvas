-- Run once in the dedicated Canvas project's SQL editor.
-- Every application table is private: only the Vercel service-role client has access.
create table if not exists public.site_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null check (length(display_name) between 1 and 80),
  role text not null default 'member' check (role in ('admin','member')),
  enabled boolean not null default true,
  activated boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);
create table if not exists public.site_sessions (
  token_hash text primary key,
  user_id uuid not null references public.site_accounts(id) on delete cascade,
  kind text not null check (kind in ('member','admin','relay')),
  parent_hash text references public.site_sessions(token_hash) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists site_sessions_user on public.site_sessions(user_id);
create index if not exists site_sessions_expiry on public.site_sessions(expires_at);
create table if not exists public.site_access_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.site_accounts(id) on delete set null,
  actor_id uuid references public.site_accounts(id) on delete set null,
  email text not null,
  event text not null,
  created_at timestamptz not null default now()
);
create index if not exists site_events_time on public.site_access_events(created_at desc);
create table if not exists public.site_rate_limits (
  key text primary key,
  attempts integer not null,
  expires_at timestamptz not null
);
alter table public.site_accounts enable row level security;
alter table public.site_sessions enable row level security;
alter table public.site_access_events enable row level security;
alter table public.site_rate_limits enable row level security;
revoke all on public.site_accounts, public.site_sessions, public.site_access_events, public.site_rate_limits from anon, authenticated;
grant all on public.site_accounts, public.site_sessions, public.site_access_events, public.site_rate_limits to service_role;
grant usage, select on sequence public.site_access_events_id_seq to service_role;

create or replace function public.site_allow_attempt(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare count_value integer;
begin
  delete from public.site_rate_limits where expires_at < now();
  insert into public.site_rate_limits(key, attempts, expires_at)
    values(p_key, 1, now() + make_interval(secs => p_seconds))
    on conflict(key) do update set attempts = site_rate_limits.attempts + 1
    returning attempts into count_value;
  return count_value <= p_limit;
end; $$;

create or replace function public.site_authorize_session(p_hash text, p_kind text)
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object('id', a.id, 'email', a.email, 'display_name', a.display_name,
    'role', a.role, 'expires_at', s.expires_at)
  from public.site_sessions s join public.site_accounts a on a.id = s.user_id
  where s.token_hash = p_hash and s.kind = p_kind and s.expires_at > now()
    and a.enabled and a.activated
    and (p_kind <> 'admin' or a.role = 'admin')
    and (p_kind <> 'relay' or exists(
      select 1 from public.site_sessions parent where parent.token_hash = s.parent_hash
      and parent.kind = 'member' and parent.expires_at > now() and parent.user_id = a.id
    ))
  limit 1;
$$;
create or replace function public.site_cleanup()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.site_sessions where expires_at < now();
  delete from public.site_access_events where created_at < now() - interval '30 days';
  delete from public.site_rate_limits where expires_at < now();
end; $$;
revoke all on function public.site_allow_attempt(text,integer,integer), public.site_authorize_session(text,text), public.site_cleanup() from public, anon, authenticated;
grant execute on function public.site_allow_attempt(text,integer,integer), public.site_authorize_session(text,text), public.site_cleanup() to service_role;

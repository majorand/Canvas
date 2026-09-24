-- Optional unique login aliases; existing email logins remain valid.
alter table public.site_accounts add column if not exists username text unique
  check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$');

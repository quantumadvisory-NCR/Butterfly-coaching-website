-- Security baseline: row level security, deny by default.
--
-- Every table in the public schema has RLS enabled and there are deliberately
-- NO policies for the `anon` or `authenticated` roles. All reads and writes go
-- through the Next.js server, which connects with the role in DATABASE_URL and
-- enforces authorisation in code (src/lib/auth). The Supabase Data API
-- therefore exposes nothing, even to someone holding the public anon key.
--
-- When you add a table in a later migration, enable RLS on it in that same
-- migration. tests/unit/db.security.test.ts fails if any table is missed.

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
--> statement-breakpoint

-- Supabase-specific hardening. Each block is skipped on plain PostgreSQL
-- (local development mode), where these roles and schemas do not exist.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon')
     and exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on all tables in schema public from anon, authenticated;
    revoke all on all sequences in schema public from anon, authenticated;
    revoke all on all functions in schema public from anon, authenticated;
    alter default privileges in schema public revoke all on tables from anon, authenticated;
    alter default privileges in schema public revoke all on sequences from anon, authenticated;
    alter default privileges in schema public revoke all on functions from anon, authenticated;
  end if;
end $$;
--> statement-breakpoint

do $$
begin
  -- Staff profiles mirror Supabase Auth users one to one.
  if exists (select 1 from pg_namespace where nspname = 'auth')
     and not exists (select 1 from pg_constraint where conname = 'profiles_id_auth_users_fkey') then
    alter table public.profiles
      add constraint profiles_id_auth_users_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
end $$;
--> statement-breakpoint

do $$
begin
  -- Public-read media bucket. Uploads and deletes happen only on the server
  -- with the service role key; there are no storage policies for anon users,
  -- so nobody can list, upload or delete through the public API.
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'media',
      'media',
      true,
      10485760,
      array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'application/pdf']
    )
    on conflict (id) do nothing;
  end if;
end $$;

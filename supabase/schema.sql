-- Run this in the Supabase SQL Editor

create table if not exists player_ranks (
  id uuid default gen_random_uuid() primary key,
  captain_name text not null,
  rank integer not null,
  points integer not null,
  recorded_at timestamp default now()
);

create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  stage text not null,
  group_name text,
  team1 text not null,
  team2 text not null,
  score1 integer,
  score2 integer,
  match_date date,
  updated_at timestamp default now()
);

-- Storage bucket for avatars
-- Bucket name: avatars (public)
-- The SQL below creates the bucket + upload policies automatically.
alter table matches enable row level security;
alter table player_ranks enable row level security;

create policy "Allow public read matches" on matches for select using (true);
create policy "Allow public insert matches" on matches for insert with check (true);
create policy "Allow public update matches" on matches for update using (true);

create policy "Allow public read ranks" on player_ranks for select using (true);
create policy "Allow public insert ranks" on player_ranks for insert with check (true);

-- ─── Avatars (Storage) — required for profile photos ───────────────────────
-- Run this whole block in SQL Editor. Safe to re-run (idempotent).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar public read" on storage.objects;
drop policy if exists "Avatar public insert" on storage.objects;
drop policy if exists "Avatar public update" on storage.objects;
drop policy if exists "avatars public read" on storage.objects;
drop policy if exists "avatars public insert" on storage.objects;
drop policy if exists "avatars public update" on storage.objects;

create policy "Avatar public read"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Avatar public insert"
on storage.objects for insert
with check (bucket_id = 'avatars');

create policy "Avatar public update"
on storage.objects for update
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

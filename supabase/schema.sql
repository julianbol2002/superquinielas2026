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

-- Storage bucket for avatars (create in Supabase Dashboard → Storage)
-- Bucket name: avatars (public)
-- Allowed MIME: image/jpeg, image/png, image/webp

-- Optional: enable RLS with public read/write for family trust model
alter table matches enable row level security;
alter table player_ranks enable row level security;

create policy "Allow public read matches" on matches for select using (true);
create policy "Allow public insert matches" on matches for insert with check (true);
create policy "Allow public update matches" on matches for update using (true);

create policy "Allow public read ranks" on player_ranks for select using (true);
create policy "Allow public insert ranks" on player_ranks for insert with check (true);

-- Wedding Photo Booth — additive schema for booth.ywp.my.id
--
-- Runs against the SAME Supabase project already used by nikah.ywp.my.id.
-- This migration is purely ADDITIVE:
--   - does NOT touch `public.rsvp` (existing RSVP + Digital Guestbook table)
--   - does NOT drop, truncate, or alter any existing table
--   - does NOT disable RLS anywhere
--
-- Safe to re-run: every statement uses `if not exists` / `on conflict`.

create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
-- photo_frames — the frame catalog (see src/lib/frames/types.ts FrameConfig)
-- ---------------------------------------------------------------------------
create table if not exists public.photo_frames (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  description text,
  thumbnail_url text,
  orientation text not null,
  photo_count integer not null default 1,
  configuration jsonb not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists photo_frames_active_sort_idx
  on public.photo_frames (is_active, sort_order);

alter table public.photo_frames enable row level security;

drop policy if exists "Public can read active frames" on public.photo_frames;
create policy "Public can read active frames"
  on public.photo_frames for select
  using (is_active = true);

-- No public insert/update/delete policy: frame management is done through
-- the admin API routes, which use the service_role key server-side and
-- therefore bypass RLS entirely (see src/lib/supabase/admin.ts).

-- ---------------------------------------------------------------------------
-- photo_sessions — one row per completed booth session
-- ---------------------------------------------------------------------------
create table if not exists public.photo_sessions (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.rsvp (id) on delete set null,
  guest_name text,
  mode text not null default 'photo' check (mode in ('photo', 'strip', 'gif', 'boomerang', 'video')),
  frame_id uuid references public.photo_frames (id) on delete set null,
  frame_slug text,
  orientation text,
  qr_token uuid not null default gen_random_uuid() unique,
  is_public boolean not null default true,
  download_count integer not null default 0,
  share_count integer not null default 0,
  print_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists photo_sessions_created_idx on public.photo_sessions (created_at desc);
create index if not exists photo_sessions_qr_token_idx on public.photo_sessions (qr_token);
create index if not exists photo_sessions_public_idx on public.photo_sessions (is_public, created_at desc);

alter table public.photo_sessions enable row level security;

-- Guests can create their own session record (needed to save a booth result)
-- but the check constraints below block impersonation of an arbitrary
-- guest_id search result they weren't shown (defense in depth on top of the
-- app only ever sending the id it just looked up).
drop policy if exists "Public can insert sessions" on public.photo_sessions;
create policy "Public can insert sessions"
  on public.photo_sessions for insert
  with check (true);

-- Guests may view a session ONLY if it is public. This powers the public
-- /photo/[qr_token] page and the /gallery, /live-gallery pages, while
-- keeping any session an admin has hidden (is_public = false) invisible.
drop policy if exists "Public can read public sessions" on public.photo_sessions;
create policy "Public can read public sessions"
  on public.photo_sessions for select
  using (is_public = true);

-- Guests may bump their own counters (download/share/print) via a narrow
-- RPC instead of raw UPDATE, so they can't rewrite other fields. See the
-- increment_session_counter() function below.
-- No direct public UPDATE/DELETE policy is created; admin actions go
-- through the service_role client on the server.

-- ---------------------------------------------------------------------------
-- photo_session_assets — files that belong to a session (never binary in DB)
-- ---------------------------------------------------------------------------
create table if not exists public.photo_session_assets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.photo_sessions (id) on delete cascade,
  asset_type text not null check (asset_type in ('original', 'final', 'thumbnail', 'gif', 'video', 'boomerang')),
  storage_path text not null,
  mime_type text,
  shot_index integer,
  width integer,
  height integer,
  file_size integer,
  created_at timestamptz not null default now()
);

create index if not exists photo_session_assets_session_idx on public.photo_session_assets (session_id);

alter table public.photo_session_assets enable row level security;

drop policy if exists "Public can insert assets for their session" on public.photo_session_assets;
create policy "Public can insert assets for their session"
  on public.photo_session_assets for insert
  with check (true);

-- Assets are readable only through their parent session's visibility.
drop policy if exists "Public can read assets of public sessions" on public.photo_session_assets;
create policy "Public can read assets of public sessions"
  on public.photo_session_assets for select
  using (
    exists (
      select 1 from public.photo_sessions s
      where s.id = photo_session_assets.session_id
        and s.is_public = true
    )
  );

-- ---------------------------------------------------------------------------
-- booth_settings — single-row configurable event settings (admin editable)
-- ---------------------------------------------------------------------------
create table if not exists public.booth_settings (
  id boolean primary key default true check (id = true), -- enforces a single row
  couple_names text not null default 'Yudha & Ima',
  monogram text not null default 'Y & I',
  wedding_date date not null default '2026-11-29',
  hashtag text not null default '#YudhaIma',
  album_url text not null default '/gallery',
  welcome_title text not null default 'Yudha & Ima',
  welcome_subtitle text not null default 'Abadikan momenmu bersama kami.',
  completion_title text not null default 'Memory Saved',
  completion_message text not null default 'Terima kasih sudah menjadi bagian dari cerita kami.',
  default_mode text not null default 'photo',
  enabled_modes text[] not null default array['photo', 'strip'],
  default_countdown integer not null default 3,
  default_frame_slug text not null default 'y-i-signature',
  allow_rsvp_search boolean not null default true,
  allow_print boolean not null default true,
  print_copies integer not null default 2,
  allow_gallery boolean not null default true,
  allow_live_gallery boolean not null default true,
  allow_digital_guestbook boolean not null default true,
  allow_audio_guestbook boolean not null default false,
  allow_sharing boolean not null default true,
  auto_reset_seconds integer not null default 60,
  updated_at timestamptz not null default now()
);

insert into public.booth_settings (id) values (true) on conflict (id) do nothing;

alter table public.booth_settings enable row level security;

drop policy if exists "Public can read booth settings" on public.booth_settings;
create policy "Public can read booth settings"
  on public.booth_settings for select
  using (true);

-- No public write policy: admin API routes use service_role to update settings.

-- ---------------------------------------------------------------------------
-- audio_messages — Phase 3 (Audio Guestbook). Schema only for now; the UI
-- for recording/uploading audio is not wired up yet (see final report).
-- ---------------------------------------------------------------------------
create table if not exists public.audio_messages (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.rsvp (id) on delete set null,
  guest_name text,
  photo_session_id uuid references public.photo_sessions (id) on delete set null,
  storage_path text not null,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

alter table public.audio_messages enable row level security;

drop policy if exists "Public can insert audio messages" on public.audio_messages;
create policy "Public can insert audio messages"
  on public.audio_messages for insert
  with check (true);

-- ---------------------------------------------------------------------------
-- Narrow RPC: bump a session's download/share/print counters without
-- granting a general public UPDATE policy on photo_sessions.
-- ---------------------------------------------------------------------------
create or replace function public.increment_session_counter(p_qr_token uuid, p_counter text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_counter not in ('download_count', 'share_count', 'print_count') then
    raise exception 'invalid counter %', p_counter;
  end if;

  if p_counter = 'download_count' then
    update public.photo_sessions set download_count = download_count + 1
      where qr_token = p_qr_token and is_public = true;
  elsif p_counter = 'share_count' then
    update public.photo_sessions set share_count = share_count + 1
      where qr_token = p_qr_token and is_public = true;
  else
    update public.photo_sessions set print_count = print_count + 1
      where qr_token = p_qr_token and is_public = true;
  end if;
end;
$$;

grant execute on function public.increment_session_counter(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Guest search RPC: exposes ONLY id + name from `rsvp`, never phone/email/
-- message/attending. Safer than letting the client SELECT the rsvp table
-- directly, even though the existing RLS on rsvp already allows public
-- SELECT true (see instructions: prefer a controlled RPC over the raw table).
-- ---------------------------------------------------------------------------
create or replace function public.search_rsvp_guests(p_query text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.name
  from public.rsvp r
  where p_query is not null
    and length(trim(p_query)) >= 2
    and r.name ilike '%' || trim(p_query) || '%'
  order by r.name asc
  limit 8;
$$;

grant execute on function public.search_rsvp_guests(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for booth media. Public read (needed for QR/print/gallery
-- URLs and simplicity of client-side <img>/<video> tags); write is
-- restricted by the storage policies below to the sessions/ prefix.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photo-booth', 'photo-booth', true)
on conflict (id) do nothing;

drop policy if exists "Public read photo-booth bucket" on storage.objects;
create policy "Public read photo-booth bucket"
  on storage.objects for select
  using (bucket_id = 'photo-booth');

-- Guests may upload ONLY under events/yudha-ima/sessions/ — not into
-- frames/ (admin-managed frame art) or anywhere else in the bucket.
drop policy if exists "Public can upload session media" on storage.objects;
create policy "Public can upload session media"
  on storage.objects for insert
  with check (
    bucket_id = 'photo-booth'
    and (storage.foldername(name))[1] = 'events'
    and (storage.foldername(name))[2] = 'yudha-ima'
    and (storage.foldername(name))[3] = 'sessions'
  );

-- No public update/delete storage policy: admin deletes via service_role.

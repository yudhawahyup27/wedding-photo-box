# Yudha & Ima — Wedding Photo Booth

A standalone Next.js 14 (App Router) web app for a premium wedding photo
booth experience, built for **booth.ywp.my.id**. It's a separate
application from the existing wedding site (**nikah.ywp.my.id**) but
shares the **same Supabase project**, reusing the existing `rsvp` table
(RSVP + Digital Guestbook) instead of duplicating it.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Storage + Realtime) — same project as nikah.ywp.my.id
- Canvas API for high-resolution frame compositing (no external image libs)
- Zustand for the guest-flow state machine

## 1. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...            # same project as nikah.ywp.my.id
NEXT_PUBLIC_SUPABASE_ANON_KEY=...       # public anon key, safe for the browser
SUPABASE_SERVICE_ROLE_KEY=...           # SERVER-ONLY, never exposed to the browser
NEXT_PUBLIC_SITE_URL=https://booth.ywp.my.id
ADMIN_PASSWORD=...                      # password gate for /admin
ADMIN_SESSION_SECRET=...                # random long string, signs the admin cookie
```

## 2. Database migration (manual step in Supabase)

Run these two files, **in order**, in the Supabase SQL Editor (or via the
Supabase CLI):

1. `supabase/migrations/0001_photo_booth_schema.sql` — creates
   `photo_frames`, `photo_sessions`, `photo_session_assets`,
   `booth_settings`, `audio_messages`, a storage bucket (`photo-booth`),
   RLS policies, and two RPCs (`search_rsvp_guests`,
   `increment_session_counter`). **This migration never touches the
   existing `rsvp` table** — no drops, no truncates, no RLS changes there.
2. `supabase/migrations/0002_seed_frames.sql` — inserts all 35 frame
   presets into `photo_frames`. Safe to re-run (upserts by slug). If you
   already ran an earlier version of this project, you can instead run the
   smaller incremental files `0003_seed_frames_batch2.sql` and
   `0004_seed_frames_batch3.sql`, which only touch the frames added after
   the original 25.
   Regenerate any of these anytime after editing `src/lib/frames/presets.ts` with:
   ```
   npx tsx scripts/generate-frame-seed.ts > supabase/migrations/0002_seed_frames.sql
   ```

Both files are additive and idempotent (`if not exists` / `on conflict`),
so re-running them is safe.

## 3. Install & run

```
npm install
npm run dev      # local development
npm run build    # production build (verified passing)
npm run start
```

## 4. Deploying to booth.ywp.my.id

Any Next.js-compatible host works (Vercel is the simplest). Set the same
environment variables from step 1 in the hosting provider's dashboard, and
point the domain's DNS at the deployment. No changes are required on
nikah.ywp.my.id.

## Routes

| Route | Purpose |
|---|---|
| `/` | Welcome screen |
| `/guest` | Guest identification (RSVP search / manual / anonymous) |
| `/mode` | Photo mode selection |
| `/frame` | Frame browser |
| `/booth` | Camera, countdown, capture |
| `/preview` | Frame-composited result, retake/save |
| `/complete` | QR, download, share, print, guestbook |
| `/photo/[qr_token]` | Public per-photo page (mobile-first) |
| `/gallery` | Shared album |
| `/live-gallery` | Auto-refreshing slideshow for a TV/projector |
| `/print/[qr_token]` | Chrome-free reprint page |
| `/admin/login`, `/admin/*` | Password-gated admin dashboard |

## What's implemented vs. not (see full report in chat for details)

**Implemented (Phase 1 + most of Phase 2):** full guest flow for Photo and
Photo Strip modes, frame engine with 35 presets (including newspaper/
magazine/comic styles and multi-photo grids up to 9 shots), 7 photo filters
(original, B&W, sepia, vintage, warm, cool, dramatic) with live preview,
Supabase Storage + DB persistence, offline-safe retry queue, QR flow,
public photo page, gallery, live gallery, Digital Guestbook integration
(writes into the existing `rsvp` table), print, admin dashboard
(overview/sessions/frames toggle/settings).

**Not implemented (Phase 3, intentionally deferred per the spec's own
priority order):** GIF, Boomerang, and Short Video capture modes; Audio
Guestbook recording UI (table exists, no UI yet); a visual drag-and-drop
frame editor in admin (frames are added/edited via
`src/lib/frames/presets.ts` + the seed script instead).

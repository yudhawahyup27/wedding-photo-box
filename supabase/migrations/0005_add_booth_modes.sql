-- Add the canonical editorial booth modes without removing legacy modes.
-- Safe to re-run: the constraint is recreated with the same complete set.

alter table public.photo_sessions
  drop constraint if exists photo_sessions_mode_check;

alter table public.photo_sessions
  add constraint photo_sessions_mode_check
  check (mode in (
    'photo', 'strip', 'gif', 'boomerang', 'video',
    'classic', 'magazine', 'newspaper', 'photobook'
  ));

-- Make the new modes available when the existing singleton settings row still
-- contains only the original defaults. Preserve all existing enabled modes.
update public.booth_settings
set enabled_modes = array(
  select distinct mode
  from unnest(coalesce(enabled_modes, array[]::text[]) || array['classic', 'magazine', 'newspaper', 'photobook']) as mode
)
where id = true;

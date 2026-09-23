import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { FRAME_PRESETS, getFrameBySlug as getPresetBySlug } from './presets';
import type { FrameConfig } from './types';

interface PhotoFrameRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  thumbnail_url: string | null;
  orientation: string;
  photo_count: number;
  configuration: FrameConfig;
  is_active: boolean;
  sort_order: number;
}

function rowToFrameConfig(row: PhotoFrameRow): FrameConfig {
  // `configuration` already holds the full FrameConfig shape (photoSlots,
  // texts, decorations, colors); the top-level columns exist for
  // filtering/sorting in SQL without unpacking JSONB every time.
  return {
    ...row.configuration,
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category as FrameConfig['category'],
    description: row.description ?? row.configuration.description,
    orientation: row.orientation as FrameConfig['orientation'],
    photoCount: row.photo_count,
    enabled: row.is_active,
    sortOrder: row.sort_order,
  };
}

/**
 * Loads the frame catalog. Tries Supabase (`photo_frames`) first so admins
 * can add/disable/reorder frames without a redeploy; falls back to the
 * bundled presets (src/lib/frames/presets.ts) if the table is empty,
 * unreachable, or the booth is running before migrations are applied.
 */
export async function getFrameCatalog(): Promise<FrameConfig[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('photo_frames')
      .select('id,name,slug,category,description,thumbnail_url,orientation,photo_count,configuration,is_active,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return FRAME_PRESETS;
    }
    const dbFrames = (data as PhotoFrameRow[]).map(rowToFrameConfig);
    const dbSlugs = new Set(dbFrames.map((f) => f.slug));
    const codePresets = FRAME_PRESETS.filter((p) => !dbSlugs.has(p.slug));
    return [...dbFrames, ...codePresets];
  } catch {
    return FRAME_PRESETS;
  }
}

export async function getFrameBySlug(slug: string): Promise<FrameConfig | undefined> {
  const catalog = await getFrameCatalog();
  return catalog.find((f) => f.slug === slug) ?? getPresetBySlug(slug);
}

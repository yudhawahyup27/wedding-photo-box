import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const BUCKET = 'photo-booth';
const EVENT_SLUG = 'yudha-ima';

export function sessionAssetPath(sessionId: string, filename: string) {
  return `events/${EVENT_SLUG}/sessions/${sessionId}/${filename}`;
}

export async function uploadSessionAsset(sessionId: string, filename: string, blob: Blob, contentType: string) {
  const supabase = getSupabaseBrowserClient();
  const path = sessionAssetPath(sessionId, filename);
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType,
    // Keep guest uploads compatible with the public INSERT-only policy.
    // Retries handle an already-existing object in save.ts.
    upsert: false,
  });
  if (error && !isAlreadyExistsError(error)) throw error;
  return path;
}

export function isAlreadyExistsError(error: { message?: string; statusCode?: string | number } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? '';
  return error?.statusCode === 409 || message.includes('already exists') || message.includes('duplicate');
}

export function getPublicMediaUrl(storagePath: string): string {
  const supabase = getSupabaseBrowserClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = /data:([^;]+);base64/.exec(meta);
  const mime = mimeMatch?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getPublicMediaUrl } from '@/lib/media/upload';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';

/**
 * Clean, chrome-free print output for a saved session — useful for
 * reprinting from the admin dashboard or a second device. The booth's
 * own completion screen prints locally (works offline); this route is
 * the reprint path once the session has synced to Supabase.
 */
export default function PrintPage() {
  const params = useParams<{ token: string }>();
  const { config } = useWeddingConfig();
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: session } = await supabase
        .from('photo_sessions')
        .select('id')
        .eq('qr_token', params.token)
        .maybeSingle();
      if (!session) return;
      const { data: asset } = await supabase
        .from('photo_session_assets')
        .select('storage_path')
        .eq('session_id', session.id)
        .eq('asset_type', 'final')
        .maybeSingle();
      if (asset) {
        setImgUrl(getPublicMediaUrl(asset.storage_path));
        setTimeout(() => window.print(), 400);
      }
    })();
  }, [params.token]);

  return (
    <div id="print-area" className="mx-auto max-w-2xl p-6 print:p-0">
      {Array.from({ length: config.printCopies }).map((_, i) =>
        imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={imgUrl} alt="" className="mb-4 w-full" />
        ) : null
      )}
      {!imgUrl && <p className="text-center text-sm text-ink-soft print:hidden">Memuat foto...</p>}
    </div>
  );
}

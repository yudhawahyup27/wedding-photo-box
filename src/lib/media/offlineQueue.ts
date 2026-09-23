'use client';

import { get, set, del, keys } from 'idb-keyval';
import type { SaveSessionInput } from '@/lib/session/save';
import type { MediaItem } from '@/lib/frames/types';

const QUEUE_PREFIX = 'booth-pending-upload:';

export interface QueuedUpload {
  sessionId: string;
  qrToken: string;
  input: SaveSessionInput;
  finalDataUrl: string;
  thumbnailDataUrl: string;
  shotDataUrls: string[];
  mediaItems?: MediaItem[];
  queuedAt: number;
}

/**
 * Keeps a rendered result safe on-device when upload fails (unreliable
 * venue wifi — see spec section 43). The queue is keyed by sessionId, so
 * retrying never creates a duplicate session record.
 */
export async function queuePendingUpload(job: QueuedUpload) {
  await set(QUEUE_PREFIX + job.sessionId, job);
}

export async function removePendingUpload(sessionId: string) {
  await del(QUEUE_PREFIX + sessionId);
}

export async function getPendingUpload(sessionId: string): Promise<QueuedUpload | undefined> {
  return get(QUEUE_PREFIX + sessionId);
}

export async function listPendingUploads(): Promise<QueuedUpload[]> {
  const allKeys = await keys();
  const jobs: QueuedUpload[] = [];
  for (const k of allKeys) {
    if (typeof k === 'string' && k.startsWith(QUEUE_PREFIX)) {
      const job = await get(k);
      if (job) jobs.push(job as QueuedUpload);
    }
  }
  return jobs.sort((a, b) => a.queuedAt - b.queuedAt);
}

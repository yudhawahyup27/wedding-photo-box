const RESERVED_PATHS = new Set([
  'admin',
  'api',
  'booth',
  'complete',
  'frame',
  'gallery',
  'guest',
  'live-gallery',
  'mode',
  'preview',
]);

export function getEventSlugFromPath(pathname: string) {
  const slug = pathname.split('/').filter(Boolean)[0]?.toLowerCase() ?? '';
  if (!slug || RESERVED_PATHS.has(slug) || slug.includes('.')) return null;
  return slug;
}

export function formatEventSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

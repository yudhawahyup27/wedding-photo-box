import type { FrameConfig, FrameText, TemplateText } from './types';
import type { WeddingConfig } from '@/lib/wedding/config';
import { drawDecoration } from './decorations';

const FONT_ROLE_MAP: Record<FrameText['role'], string> = {
  display: '"Cormorant Garamond", serif',
  script: '"Cormorant Garamond", serif',
  label: '"Inter", sans-serif',
  mono: '"Inter", sans-serif',
};

function resolveTokens(value: string, wedding: WeddingConfig, templateText?: Partial<TemplateText>) {
  const dateLabel = new Date(wedding.weddingDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return value
    .replaceAll('{{couple}}', wedding.coupleNames)
    .replaceAll('{{headline}}', templateText?.headline || 'Happily Ever After')
    .replaceAll('{{subheadline}}', templateText?.subheadline || 'Special Edition')
    .replaceAll('{{name}}', templateText?.name || wedding.coupleNames)
    .replaceAll('{{eventDate}}', templateText?.date || dateLabel)
    .replaceAll('{{quote}}', templateText?.quote || 'Love, laughter, and forever')
    .replaceAll('{{article}}', templateText?.article || 'Celebrating the beginning of a lifetime together.')
    .replaceAll('{{venue}}', templateText?.venue || '')
    .replaceAll('{{issue}}', templateText?.issueNumber || '01')
    .replaceAll('{{monogram}}', wedding.monogram)
    .replaceAll('{{date}}', dateLabel)
    .replaceAll('{{hashtag}}', wedding.hashtag)
    .replaceAll('{{eventType}}', templateText?.eventType || 'General')
    .replaceAll('{{eventName}}', templateText?.eventName || '')
    .replaceAll('{{host}}', templateText?.host || templateText?.name || wedding.coupleNames)
    .replaceAll('{{location}}', templateText?.location || '')
    .replaceAll('{{tagline}}', templateText?.tagline || '')
    .replaceAll('{{caption}}', templateText?.caption || 'Captured during today\'s session.')
    .replaceAll('{{edition}}', templateText?.edition || 'City Edition');
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const normalized = value.length === 3 ? value.split('').map((ch) => ch + ch).join('') : value;
  const numeric = Number.parseInt(normalized, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function paintFrameBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number, base: string, accent: string) {
  // Paint solid base color cleanly
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Soft natural paper warmth highlight in the center
  const isDark = base === '#111111' || base === '#1a1816' || base.startsWith('#2') || base.startsWith('#1');
  if (!isDark) {
    const radial = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, Math.max(W, H) * 0.85);
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    radial.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.025)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export interface RenderFrameParams {
  frame: FrameConfig;
  /** Captured shots, in slot order. A missing slot is left as a soft placeholder. */
  photos: (HTMLImageElement | HTMLVideoElement | null)[];
  wedding: WeddingConfig;
  /** Export resolution multiplier over the frame's logical canvasWidth/canvasHeight. Use >=2 for print. */
  scale?: number;
  /** Mirror captured photos horizontally (selfie feel) at render time. */
  mirror?: boolean;
  /** CSS filter string (see src/lib/filters/presets.ts) applied to every photo slot. */
  filterCss?: string;
  templateText?: Partial<TemplateText>;
}

/** Renders a captured session into a specific FrameConfig at print resolution. */
export async function renderFrame({ frame, photos, wedding, scale = 2, mirror = true, filterCss = 'none', templateText }: RenderFrameParams): Promise<HTMLCanvasElement> {
  const W = frame.canvasWidth * scale;
  const H = frame.canvasHeight * scale;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore, fall back to default font metrics */
    }
  }

  // Background
  paintFrameBackdrop(ctx, W, H, frame.backgroundColor, frame.accentColor);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Decorations drawn UNDER photos first (borders/vignette-style pieces look
  // fine either way; floral corners specifically read better under photos
  // when slots don't overlap them, which our presets are designed to avoid).
  const backDecorations = frame.decorations.filter((d) => d.layer !== 'front');
  const frontDecorations = frame.decorations.filter((d) => d.layer === 'front');
  const resolveDecoration = (d: (typeof frame.decorations)[number]) => ({
    ...d,
    text: d.text ? resolveTokens(d.text, wedding, templateText) : d.text,
    subtext: d.subtext ? resolveTokens(d.subtext, wedding, templateText) : d.subtext,
  });
  backDecorations.forEach((d) => drawDecoration(ctx, resolveDecoration(d), W, H, scale, frame.accentColor, wedding.monogram));

  // Photo slots
  frame.photoSlots.forEach((slot, index) => {
    const x = slot.x * scale;
    const y = slot.y * scale;
    const w = slot.width * scale;
    const h = slot.height * scale;
    const radius = (slot.radius ?? 8) * scale;
    const img = photos[index];

    ctx.save();
    if (slot.rotate) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((slot.rotate * Math.PI) / 180);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }

    ctx.save();
    ctx.shadowColor = 'rgba(20, 14, 10, 0.14)';
    ctx.shadowBlur = Math.max(12, scale * 12);
    ctx.shadowOffsetY = Math.max(6, scale * 6);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundedRectPath(ctx, x, y, w, h, radius);
    ctx.fill();
    ctx.restore();

    roundedRectPath(ctx, x, y, w, h, radius);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#e9e4d8';
    ctx.fillRect(x, y, w, h);

    if (img) {
      const iw = 'videoWidth' in img ? img.videoWidth : img.width;
      const ih = 'videoHeight' in img ? img.videoHeight : img.height;
      const coverScale = Math.max(w / iw, h / ih);
      const dw = iw * coverScale;
      const dh = ih * coverScale;
      const dx = x - (dw - w) / 2;
      const dy = y - (dh - h) / 2;
      ctx.filter = filterCss;
      if (mirror) {
        ctx.save();
        // Flip horizontally about the slot's own center so the cover-fit
        // math above stays identical to the non-mirrored path.
        ctx.translate(x + w / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-(x + w / 2), 0);
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      } else {
        ctx.drawImage(img, dx, dy, dw, dh);
      }
      ctx.filter = 'none';
    }
    ctx.restore();

    ctx.lineWidth = Math.max(1.2, scale * 1.35);
    ctx.strokeStyle = hexToRgba(frame.accentColor, 0.22);
    ctx.stroke();

    const inset = Math.max(2, scale * 2.5);
    roundedRectPath(ctx, x + inset / 2, y + inset / 2, w - inset, h - inset, Math.max(0, radius - inset / 2));
    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.lineWidth = Math.max(0.8, scale * 0.75);
    ctx.stroke();
    ctx.restore();
  });

  // Front-layer decorations (speech bubbles, magazine cover lines, comic
  // bursts) sit on top of the photo, like a real caption or cover element.
  frontDecorations.forEach((d) => drawDecoration(ctx, resolveDecoration(d), W, H, scale, frame.accentColor, wedding.monogram));

  // Outer frame edge (delicate and soft, omitted for full-bleed and newspaper/magazine layouts)
  const isFullBleedOrEditorial =
    frame.category === 'newspaper' ||
    frame.category === 'magazine' ||
    frame.slug.includes('newspaper') ||
    frame.slug.includes('magazine') ||
    frame.photoSlots.some((s) => s.x === 0);

  if (!isFullBleedOrEditorial) {
    ctx.save();
    ctx.strokeStyle = hexToRgba(frame.accentColor, 0.22);
    ctx.lineWidth = Math.max(1, scale * 1.2);
    roundedRectPath(ctx, scale * 8, scale * 8, W - scale * 16, H - scale * 16, scale * 8);
    ctx.stroke();
    ctx.restore();
  }

  // Text layers (drawn after photos so captions stay legible)
  frame.texts.forEach((t) => {
    ctx.save();
    ctx.shadowColor = 'rgba(18, 12, 9, 0.12)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = t.color;
    ctx.textAlign = t.align;
    ctx.textBaseline = 'middle';
    const font = FONT_ROLE_MAP[t.role];
    ctx.font = `${t.size * scale}px ${font}`;
    const text = resolveTokens(t.value, wedding, templateText);
    if (t.maxWidth) {
      drawWrappedText(ctx, text, t.x * scale, t.y * scale, t.maxWidth * scale, (t.lineHeight ?? t.size * 1.05) * scale);
    } else if (t.letterSpacing && t.letterSpacing > 0) {
      drawLetterSpaced(ctx, text, t.x * scale, t.y * scale, t.letterSpacing * scale, t.align);
    } else {
      ctx.fillText(text, t.x * scale, t.y * scale);
    }
    ctx.restore();
  });

  return canvas;
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const lines: string[] = [];
  text.split(/\n/).forEach((paragraph) => {
    let line = '';
    paragraph.split(/\s+/).forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
    });
    if (line) lines.push(line);
  });
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => ctx.fillText(line, x, startY + index * lineHeight));
}

function drawLetterSpaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: 'left' | 'center' | 'right') {
  const widths = Array.from(text).map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let startX = x;
  if (align === 'center') startX = x - total / 2;
  if (align === 'right') startX = x - total;
  ctx.textAlign = 'left';
  let cursor = startX;
  Array.from(text).forEach((ch, i) => {
    ctx.fillText(ch, cursor, y);
    cursor += widths[i] + spacing;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.95): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

export function makeThumbnail(source: HTMLCanvasElement, maxSize = 480): Promise<Blob | null> {
  const ratio = Math.min(1, maxSize / Math.max(source.width, source.height));
  const w = Math.round(source.width * ratio);
  const h = Math.round(source.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(source, 0, 0, w, h);
  return canvasToBlob(canvas, 'image/jpeg', 0.82);
}

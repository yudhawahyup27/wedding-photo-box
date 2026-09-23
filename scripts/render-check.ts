// @ts-nocheck
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { FRAME_PRESETS } from '../src/lib/frames/presets';
import { drawDecoration } from '../src/lib/frames/decorations';

const wedding = {
  coupleNames: 'Yudha & Ima',
  monogram: 'Y & I',
  weddingDate: '2026-11-29',
  hashtag: '#YudhaIma',
};

function resolveTokens(value: string) {
  const dateLabel = new Date(wedding.weddingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  return value
    .replaceAll('{{couple}}', wedding.coupleNames)
    .replaceAll('{{monogram}}', wedding.monogram)
    .replaceAll('{{date}}', dateLabel)
    .replaceAll('{{hashtag}}', wedding.hashtag);
}

function roundedRectPath(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

const FONT_ROLE_MAP: Record<string, string> = {
  display: 'serif',
  script: 'italic serif',
  label: 'sans-serif',
  mono: 'sans-serif',
};

const slugsToCheck = ['wedding-gazette-cover', 'headline-love-story', 'nine-grid-mosaic', 'big-and-small-grid', 'comic-pop', 'magazine-cover', 'six-grid-memories'];

for (const slug of slugsToCheck) {
  const frame = FRAME_PRESETS.find((f) => f.slug === slug);
  if (!frame) continue;
  const scale = 1;
  const W = frame.canvasWidth * scale;
  const H = frame.canvasHeight * scale;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d') as any;

  ctx.fillStyle = frame.backgroundColor;
  ctx.fillRect(0, 0, W, H);

  const back = frame.decorations.filter((d) => d.layer !== 'front');
  const front = frame.decorations.filter((d) => d.layer === 'front');
  const resolve = (d: any) => ({ ...d, text: d.text ? resolveTokens(d.text) : d.text, subtext: d.subtext ? resolveTokens(d.subtext) : d.subtext });
  back.forEach((d) => drawDecoration(ctx, resolve(d), W, H, scale, frame.accentColor, wedding.monogram));

  const colors = ['#c9b8a0', '#a9b8a0', '#b8a0c9', '#a0b8c9', '#c9a0a0', '#a0c9b8', '#c9c9a0', '#a0a0c9', '#c9a0c0'];
  frame.photoSlots.forEach((s, i) => {
    ctx.save();
    roundedRectPath(ctx, s.x * scale, s.y * scale, s.width * scale, s.height * scale, (s.radius ?? 8) * scale);
    ctx.clip();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(s.x * scale, s.y * scale, s.width * scale, s.height * scale);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.font = `${Math.min(s.width, s.height) * 0.18}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), (s.x + s.width / 2) * scale, (s.y + s.height / 2) * scale);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    roundedRectPath(ctx, s.x * scale, s.y * scale, s.width * scale, s.height * scale, (s.radius ?? 8) * scale);
    ctx.stroke();
  });

  front.forEach((d) => drawDecoration(ctx, resolve(d), W, H, scale, frame.accentColor, wedding.monogram));

  frame.texts.forEach((t) => {
    ctx.save();
    ctx.fillStyle = t.color;
    ctx.textAlign = t.align;
    ctx.textBaseline = 'middle';
    ctx.font = `${t.size * scale}px ${FONT_ROLE_MAP[t.role]}`;
    ctx.fillText(resolveTokens(t.value), t.x * scale, t.y * scale);
    ctx.restore();
  });

  const out = `/tmp/frame_check_${slug}.png`;
  writeFileSync(out, canvas.toBuffer('image/png'));
  console.log('wrote', out);
}

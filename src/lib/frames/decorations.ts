import type { FrameDecoration } from './types';

type Placement = NonNullable<FrameDecoration['placement']>[number];

const CORNERS: Placement[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

function forEachCorner(placement: Placement[] | undefined, W: number, H: number, pad: number, fn: (cx: number, cy: number, corner: Placement) => void) {
  const list = !placement || placement.includes('all') ? CORNERS : placement.filter((p) => CORNERS.includes(p));
  list.forEach((corner) => {
    const cx = corner.includes('left') ? pad : W - pad;
    const cy = corner.includes('top') ? pad : H - pad;
    fn(cx, cy, corner);
  });
}

/** A small procedural botanical sprig: a stem with a handful of leaf/petal shapes. Kept abstract & elegant rather than literal, so it reads well at print size without needing external art assets. */
function drawSprig(ctx: CanvasRenderingContext2D, size: number, color: string, flip: { x: number; y: number }) {
  ctx.save();
  ctx.scale(flip.x, flip.y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.02;
  ctx.lineCap = 'round';

  // main stem, a gentle curve
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.25, size * 0.05, size * 0.5, size * 0.25, size * 0.62, size * 0.62);
  ctx.globalAlpha = 0.85;
  ctx.stroke();

  const leafAt = (t: number, leafSize: number, dir: number) => {
    const x = size * 0.62 * t;
    const y = size * 0.62 * t * t * 1.1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((dir * Math.PI) / 3.4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(leafSize * 0.5, -leafSize * 0.35, leafSize, 0);
    ctx.quadraticCurveTo(leafSize * 0.5, leafSize * 0.35, 0, 0);
    ctx.globalAlpha = 0.75;
    ctx.fill();
    ctx.restore();
  };

  leafAt(0.28, size * 0.22, -1);
  leafAt(0.5, size * 0.26, 1);
  leafAt(0.72, size * 0.24, -1);
  leafAt(0.92, size * 0.2, 1);

  // small blossom at the tip
  const tipX = size * 0.62;
  const tipY = size * 0.62 * 0.62 * 1.1;
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.06, size * 0.045, size * 0.075, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  ctx.restore();
}

function drawMonogramBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, monogram: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = r * 0.035;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = r * 0.012;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.68}px "Cormorant Garamond", serif`;
  ctx.fillText(monogram, 0, r * 0.05);
  ctx.restore();
}

export function drawDecoration(
  ctx: CanvasRenderingContext2D,
  decoration: FrameDecoration,
  W: number,
  H: number,
  scale: number,
  defaultColor: string,
  monogram: string
) {
  const color = decoration.color ?? defaultColor;

  switch (decoration.kind) {
    case 'floral-corner': {
      const size = Math.min(W, H) * 0.16;
      forEachCorner(decoration.placement, W, H, size * 0.35, (cx, cy, corner) => {
        ctx.save();
        ctx.translate(cx, cy);
        const flip = {
          x: corner.includes('right') ? -1 : 1,
          y: corner.includes('bottom') ? -1 : 1,
        };
        drawSprig(ctx, size, color, flip);
        ctx.restore();
      });
      break;
    }
    case 'floral-border': {
      const edges = decoration.placement ?? ['top', 'bottom'];
      const size = Math.min(W, H) * 0.1;
      edges.forEach((edge) => {
        const count = Math.max(3, Math.round(W / (size * 2.4)));
        for (let i = 0; i < count; i++) {
          const t = (i + 0.5) / count;
          const x = t * W;
          const y = edge === 'top' ? size * 0.45 : H - size * 0.45;
          ctx.save();
          ctx.translate(x, y);
          const flip = { x: i % 2 === 0 ? 1 : -1, y: edge === 'top' ? 1 : -1 };
          drawSprig(ctx, size, color, flip);
          ctx.restore();
        }
      });
      break;
    }
    case 'monogram-badge': {
      const r = Math.min(W, H) * 0.09;
      const placement = decoration.placement?.[0] ?? 'top';
      const cx = W / 2;
      const cy = placement === 'bottom' ? H - r * 1.3 : r * 1.3;
      drawMonogramBadge(ctx, cx, cy, r, color, monogram);
      break;
    }
    case 'thin-rule':
    case 'double-rule': {
      const positions = decoration.placement ?? ['top', 'bottom'];
      const margin = W * 0.08;
      positions.forEach((pos) => {
        const y = pos === 'top' ? H * 0.06 : H * 0.94;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = Math.max(1, scale * 0.9);
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(W - margin, y);
        ctx.stroke();
        if (decoration.kind === 'double-rule') {
          ctx.beginPath();
          ctx.moveTo(margin, y + 5 * scale * (pos === 'top' ? 1 : -1));
          ctx.lineTo(W - margin, y + 5 * scale * (pos === 'top' ? 1 : -1));
          ctx.stroke();
        }
        ctx.restore();
      });
      break;
    }
    case 'gold-corner': {
      const len = Math.min(W, H) * 0.07;
      const pad = Math.min(W, H) * 0.035;
      forEachCorner(decoration.placement, W, H, pad, (cx, cy, corner) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.5, scale * 1.6);
        ctx.beginPath();
        const dx = corner.includes('left') ? 1 : -1;
        const dy = corner.includes('top') ? 1 : -1;
        ctx.moveTo(cx, cy + len * dy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + len * dx, cy);
        ctx.stroke();
        ctx.restore();
      });
      break;
    }
    case 'film-sprockets': {
      const holeW = W * 0.014;
      const holeH = holeW * 1.4;
      const gap = holeW * 1.8;
      for (let y = gap; y < H - gap; y += gap) {
        [holeW * 0.9, W - holeW * 1.9].forEach((x) => {
          ctx.save();
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          const r = holeW * 0.22;
          ctx.moveTo(x + r, y);
          ctx.arcTo(x + holeW, y, x + holeW, y + holeH, r);
          ctx.arcTo(x + holeW, y + holeH, x, y + holeH, r);
          ctx.arcTo(x, y + holeH, x, y, r);
          ctx.arcTo(x, y, x + holeW, y, r);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }
      break;
    }
    case 'newspaper-rule': {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.85;
      const margin = W * 0.06;
      [H * 0.14, H * 0.145].forEach((y, i) => {
        ctx.lineWidth = i === 0 ? scale * 1.8 : scale * 0.8;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(W - margin, y);
        ctx.stroke();
      });
      ctx.restore();
      break;
    }
    case 'polaroid-tab': {
      ctx.save();
      ctx.translate(W / 2, H * 0.03);
      ctx.rotate(-0.03);
      ctx.fillStyle = 'rgba(220, 210, 190, 0.55)';
      ctx.fillRect(-W * 0.06, -H * 0.012, W * 0.12, H * 0.03);
      ctx.restore();
      break;
    }
    case 'dark-vignette': {
      // Soft editorial top & bottom gradient scrim so magazine masthead and bottom captions are crisp
      // without muddying or darkening the subject's face in the center of the photo
      const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.18);
      topGrad.addColorStop(0, 'rgba(18, 14, 10, 0.45)');
      topGrad.addColorStop(1, 'rgba(18, 14, 10, 0)');
      ctx.save();
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, H * 0.18);

      const bottomGrad = ctx.createLinearGradient(0, H * 0.72, 0, H);
      bottomGrad.addColorStop(0, 'rgba(18, 14, 10, 0)');
      bottomGrad.addColorStop(1, 'rgba(18, 14, 10, 0.55)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, H * 0.72, W, H * 0.28);
      ctx.restore();
      break;
    }
    case 'halftone-dots': {
      const edges = decoration.placement ?? ['bottom'];
      const bandH = H * 0.16;
      const dotR = W * 0.012;
      const step = dotR * 2.6;
      ctx.save();
      ctx.fillStyle = color;
      edges.forEach((edge) => {
        const yStart = edge === 'top' ? 0 : H - bandH;
        for (let y = yStart; y < yStart + bandH; y += step) {
          for (let x = 0; x < W; x += step) {
            const rowOffset = (Math.round((y - yStart) / step) % 2) * (step / 2);
            const distFromEdge = edge === 'top' ? y : H - y;
            const alpha = Math.max(0, 1 - distFromEdge / bandH);
            ctx.globalAlpha = 0.5 * alpha;
            ctx.beginPath();
            ctx.arc(x + rowOffset, y, dotR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      ctx.restore();
      break;
    }
    case 'speech-bubble': {
      const label = decoration.text ?? 'JUST MARRIED!';
      const bw = W * 0.62;
      const bh = H * 0.11;
      const bx = W * 0.5 - bw / 2;
      const by = H * 0.06;
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, scale * 2.4);
      const r = bh * 0.35;
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
      ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
      ctx.arcTo(bx, by + bh, bx, by, r);
      ctx.arcTo(bx, by, bx + bw, by, r);
      ctx.closePath();
      // tail
      ctx.moveTo(bx + bw * 0.28, by + bh);
      ctx.lineTo(bx + bw * 0.2, by + bh + bh * 0.35);
      ctx.lineTo(bx + bw * 0.42, by + bh);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${bh * 0.42}px "Inter", sans-serif`;
      ctx.fillText(label, bx + bw / 2, by + bh / 2);
      ctx.restore();
      break;
    }
    case 'comic-burst': {
      const label = decoration.text ?? 'POP!';
      const cx = decoration.placement?.[0]?.includes('left') ? W * 0.18 : W * 0.82;
      const cy = H * 0.14;
      const r = Math.min(W, H) * 0.09;
      const spikes = 10;
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? r : r * 0.62;
        const angle = (Math.PI * i) / spikes;
        const x = cx + rad * Math.cos(angle);
        const y = cy + rad * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${r * 0.4}px "Inter", sans-serif`;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.12);
      ctx.fillText(label, 0, 0);
      ctx.restore();
      ctx.restore();
      break;
    }
    case 'magazine-masthead': {
      const label = decoration.text ?? 'VOGUE';
      const kicker = decoration.subtext;
      ctx.save();
      
      // Top issue/kicker bar
      if (kicker) {
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.font = `600 ${H * 0.0125}px "Inter", sans-serif`;
        const kickerText = `✦  ${kicker.toUpperCase()}  ✦`;
        ctx.fillText(kickerText, W / 2, H * 0.038);
      }

      // Title font
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      let titleSize = H * 0.082;
      ctx.font = `700 ${titleSize}px "Cormorant Garamond", serif`;
      
      const maxTitleW = W * 0.88;
      while (ctx.measureText(label.toUpperCase()).width > maxTitleW && titleSize > H * 0.035) {
        titleSize -= H * 0.002;
        ctx.font = `700 ${titleSize}px "Cormorant Garamond", serif`;
      }
      
      ctx.fillText(label.toUpperCase(), W / 2, H * 0.092);

      // Fine luxury double rule below masthead
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = Math.max(1.5, scale * 1.5);
      ctx.beginPath();
      ctx.moveTo(W * 0.06, H * 0.104);
      ctx.lineTo(W * 0.94, H * 0.104);
      ctx.stroke();

      ctx.lineWidth = Math.max(0.7, scale * 0.7);
      ctx.beginPath();
      ctx.moveTo(W * 0.06, H * 0.109);
      ctx.lineTo(W * 0.94, H * 0.109);
      ctx.stroke();

      ctx.restore();
      break;
    }
    case 'magazine-cover-lines': {
      // Authentic left-aligned or right-aligned magazine cover lines
      const side = decoration.placement?.[0]?.includes('right') ? 'right' : 'left';
      const bx = side === 'left' ? W * 0.07 : W * 0.93;
      const by = (decoration.y ?? 0.28) * H;
      const align = side === 'left' ? 'left' : 'right';

      ctx.save();
      ctx.textAlign = align;

      const lines = [
        { kicker: 'SPECIAL ISSUE', title: 'THE PERFECT MATCH', sub: 'Celebrating true love' },
        { kicker: 'EXCLUSIVE', title: 'A DAY TO REMEMBER', sub: 'Moments captured in time' },
        { kicker: 'HIGHLIGHTS', title: 'FOREVER STARTS TODAY', sub: 'Best wishes & happy tears' },
      ];

      let currentY = by;
      lines.forEach((item) => {
        // Kicker tag
        ctx.fillStyle = decoration.color ?? color;
        ctx.font = `700 ${H * 0.011}px "Inter", sans-serif`;
        ctx.globalAlpha = 0.9;
        ctx.fillText(`◆  ${item.kicker}`, bx, currentY);

        // Main cover headline
        ctx.font = `700 ${H * 0.022}px "Cormorant Garamond", serif`;
        ctx.globalAlpha = 1;
        ctx.fillText(item.title, bx, currentY + H * 0.025);

        // Subtitle
        ctx.font = `400 ${H * 0.012}px "Inter", sans-serif`;
        ctx.globalAlpha = 0.75;
        ctx.fillText(item.sub, bx, currentY + H * 0.042);

        currentY += H * 0.082;
      });

      ctx.restore();
      break;
    }
    case 'newspaper-columns': {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = Math.max(1, scale * 0.7);
      const cols = 3;
      const margin = W * 0.06;
      const usable = W - margin * 2;
      for (let i = 1; i < cols; i++) {
        const x = margin + (usable / cols) * i;
        ctx.beginPath();
        ctx.moveTo(x, H * 0.88);
        ctx.lineTo(x, H * 0.96);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'barcode': {
      const bw = W * 0.26;
      const bh = H * 0.035;
      const bx = W - bw - W * 0.06;
      const by = H - bh - H * 0.035;
      ctx.save();
      ctx.fillStyle = color;
      let x = bx;
      const rand = (seed: number) => {
        const v = Math.sin(seed * 999) * 10000;
        return v - Math.floor(v);
      };
      let i = 0;
      while (x < bx + bw) {
        const w = (0.4 + rand(i) * 1.6) * (bw / 40);
        if (i % 2 === 0) ctx.fillRect(x, by, w, bh);
        x += w;
        i++;
      }
      ctx.restore();
      break;
    }
    case 'filler-lines': {
      // Simulates blocks of newspaper/magazine body text as short grey
      // bars of varying width — reads as "text" at a glance without
      // needing real filler copy or a text-layout engine.
      const bx = (decoration.x ?? 0.06) * W;
      const by = (decoration.y ?? 0.1) * H;
      const bw = (decoration.width ?? 0.4) * W;
      const lineCount = decoration.lines ?? 6;
      const lineH = Math.max(3, W * 0.006);
      const gap = lineH * 2.1;
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.32;
      const rand = (seed: number) => {
        const v = Math.sin(seed * 12.9898) * 43758.5453;
        return v - Math.floor(v);
      };
      for (let i = 0; i < lineCount; i++) {
        const isLast = i === lineCount - 1;
        const w = isLast ? bw * (0.35 + rand(i) * 0.25) : bw * (0.82 + rand(i) * 0.18);
        ctx.fillRect(bx, by + i * gap, w, lineH);
      }
      ctx.restore();
      break;
    }
    case 'body-copy': {
      // Real wrapped paragraph text (as opposed to 'filler-lines', which
      // fakes the look of text). Used for genuine short wedding copy.
      const paragraph = decoration.text ?? '';
      const bx = (decoration.x ?? 0.06) * W;
      const by = (decoration.y ?? 0.1) * H;
      const bw = (decoration.width ?? 0.4) * W;
      const fontSize = (decoration.fontSize ?? 0.018) * H;
      const lineHeight = fontSize * (decoration.lineHeight ?? 1.5);
      const align = decoration.align ?? 'left';

      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px Georgia, "Times New Roman", serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = align;

      const words = paragraph.split(/\s+/);
      let line = '';
      let cursorY = by + fontSize;
      const lineX = align === 'center' ? bx + bw / 2 : align === 'right' ? bx + bw : bx;

      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > bw && line) {
          ctx.fillText(line, lineX, cursorY);
          line = word;
          cursorY += lineHeight;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, lineX, cursorY);
      ctx.restore();
      break;
    }
    case 'paper-grain': {
      const rand = (seed: number) => {
        const value = Math.sin(seed * 12.9898) * 43758.5453;
        return value - Math.floor(value);
      };
      ctx.save();
      ctx.fillStyle = color;
      const dots = Math.round((W * H) / 2600);
      for (let i = 0; i < dots; i++) {
        ctx.globalAlpha = 0.025 + rand(i + 3) * 0.04;
        ctx.fillRect(rand(i + 11) * W, rand(i + 29) * H, 0.5 + rand(i + 47) * Math.max(1, scale * 0.8), 0.5 + rand(i + 53) * Math.max(1, scale * 0.8));
      }
      ctx.restore();
      break;
    }
    case 'qr-code': {
      const size = Math.min(W, H) * 0.095;
      const x = W * 0.06;
      const y = H - size - H * 0.032;
      const cells = 21;
      const cell = size / cells;
      ctx.save();
      ctx.fillStyle = color;
      const finder = (fx: number, fy: number) => {
        ctx.fillRect(x + fx * cell, y + fy * cell, cell * 7, cell * 7);
        ctx.fillStyle = '#F6F1E6';
        ctx.fillRect(x + (fx + 1) * cell, y + (fy + 1) * cell, cell * 5, cell * 5);
        ctx.fillStyle = color;
        ctx.fillRect(x + (fx + 2) * cell, y + (fy + 2) * cell, cell * 3, cell * 3);
      };
      finder(0, 0); finder(14, 0); finder(0, 14);
      for (let row = 0; row < cells; row++) for (let col = 0; col < cells; col++) {
        const inFinder = (col < 8 && row < 8) || (col >= 13 && row < 8) || (col < 8 && row >= 13);
        if (!inFinder && Math.sin((row + 1) * 17 + (col + 1) * 31) > 0.15) ctx.fillRect(x + col * cell, y + row * cell, cell, cell);
      }
      ctx.restore();
      break;
    }
    case 'newspaper-masthead-box': {
      const title = decoration.text ?? 'GAZETTE';
      const subtitle = decoration.subtext;
      ctx.save();
      // top double hairline
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = Math.max(1.8, scale * 1.8);
      ctx.beginPath();
      ctx.moveTo(W * 0.05, H * 0.022);
      ctx.lineTo(W * 0.95, H * 0.022);
      ctx.stroke();

      ctx.lineWidth = Math.max(0.7, scale * 0.7);
      ctx.beginPath();
      ctx.moveTo(W * 0.05, H * 0.027);
      ctx.lineTo(W * 0.95, H * 0.027);
      ctx.stroke();

      if (subtitle) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.font = `600 ${H * 0.0115}px "Inter", sans-serif`;
        ctx.fillText(subtitle.toUpperCase(), W / 2, H * 0.04);
        ctx.restore();
      }

      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      let titleSize = H * 0.052;
      const maxTitleWidth = W * 0.86;
      const minTitleSize = H * 0.022;
      ctx.font = `700 ${titleSize}px "Cormorant Garamond", serif`;
      while (ctx.measureText(title.toUpperCase()).width > maxTitleWidth && titleSize > minTitleSize) {
        titleSize -= H * 0.0015;
        ctx.font = `700 ${titleSize}px "Cormorant Garamond", serif`;
      }
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(W * 0.03, H * 0.01, W * 0.94, H * 0.08);
      ctx.clip();
      ctx.fillText(title.toUpperCase(), W / 2, H * 0.082);
      ctx.restore();

      // bottom double hairline
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = Math.max(1.8, scale * 1.8);
      ctx.beginPath();
      ctx.moveTo(W * 0.05, H * 0.093);
      ctx.lineTo(W * 0.95, H * 0.093);
      ctx.stroke();
      ctx.lineWidth = Math.max(0.7, scale * 0.7);
      ctx.beginPath();
      ctx.moveTo(W * 0.05, H * 0.098);
      ctx.lineTo(W * 0.95, H * 0.098);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'daily-moment-broadsheet': {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      const isLandscape = W >= H;

      // 1. Top Left & Right Ear Text
      const earSize = Math.max(8, H * 0.011);
      ctx.font = `700 ${earSize}px "Inter", sans-serif`;
      ctx.globalAlpha = 0.85;

      // Top Left Ear
      ctx.textAlign = 'left';
      const leftEar = ['PEOPLE', 'STORIES', 'BETTER', 'TOGETHER'];
      leftEar.forEach((line, i) => {
        ctx.fillText(line, W * 0.035, H * 0.032 + i * earSize * 1.35);
      });

      // Top Right Ear
      ctx.textAlign = 'right';
      const rightEar = ['GOOD', 'PEOPLE', 'GREATER', 'DAYS'];
      rightEar.forEach((line, i) => {
        ctx.fillText(line, W * 0.965, H * 0.032 + i * earSize * 1.35);
      });

      // 2. Main Large Masthead
      const title = decoration.text ?? 'THE DAILY MOMENT';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const mastheadSize = isLandscape ? H * 0.075 : H * 0.052;
      ctx.font = `700 ${mastheadSize}px "Cormorant Garamond", serif`;
      ctx.fillText(title.toUpperCase(), W / 2, isLandscape ? H * 0.072 : H * 0.055);

      // 3. Dateline Bar (Double Rules)
      const dateY1 = isLandscape ? H * 0.092 : H * 0.068;
      const dateY2 = isLandscape ? H * 0.125 : H * 0.092;

      ctx.lineWidth = Math.max(1.8, scale * 1.6);
      ctx.beginPath();
      ctx.moveTo(W * 0.03, dateY1);
      ctx.lineTo(W * 0.97, dateY1);
      ctx.stroke();

      ctx.lineWidth = Math.max(0.8, scale * 0.8);
      ctx.beginPath();
      ctx.moveTo(W * 0.03, dateY1 + 3 * scale);
      ctx.lineTo(W * 0.97, dateY1 + 3 * scale);
      ctx.stroke();

      // Dateline Text
      const subtextLeft = decoration.subtext ?? 'Special Celebration Issue  ·  VOL. 01 — No. 01';
      const datelineFontSize = Math.max(9, H * 0.0115);
      ctx.font = `600 ${datelineFontSize}px "Inter", sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(subtextLeft, W * 0.035, (dateY1 + dateY2) / 2 + datelineFontSize * 0.35);

      ctx.textAlign = 'right';
      ctx.fillText('PAGE 01  |  THE SPECIAL EDITION', W * 0.965, (dateY1 + dateY2) / 2 + datelineFontSize * 0.35);

      // Dateline Bottom Line
      ctx.lineWidth = Math.max(1, scale * 1);
      ctx.beginPath();
      ctx.moveTo(W * 0.03, dateY2);
      ctx.lineTo(W * 0.97, dateY2);
      ctx.stroke();

      // 4. Section Bar
      const sectY = isLandscape ? H * 0.155 : H * 0.115;
      const sectFontSize = Math.max(8, H * 0.011);
      ctx.font = `700 ${sectFontSize}px "Inter", sans-serif`;
      ctx.textAlign = 'center';

      const sections = ['CITY LIFE', 'CELEBRATION', 'THE SOCIAL EDIT', 'SPECIAL REPORT'];
      const sectStep = (W * 0.94) / sections.length;
      sections.forEach((sec, i) => {
        const secX = W * 0.03 + sectStep * (i + 0.5);
        ctx.fillText(sec, secX, sectY - (isLandscape ? 6 : 4) * scale);
        if (i < sections.length - 1) {
          ctx.beginPath();
          ctx.moveTo(W * 0.03 + sectStep * (i + 1), dateY2 + 2 * scale);
          ctx.lineTo(W * 0.03 + sectStep * (i + 1), sectY);
          ctx.stroke();
        }
      });

      // Section Bottom Double Line
      ctx.lineWidth = Math.max(1.8, scale * 1.6);
      ctx.beginPath();
      ctx.moveTo(W * 0.03, sectY);
      ctx.lineTo(W * 0.97, sectY);
      ctx.stroke();

      ctx.lineWidth = Math.max(0.8, scale * 0.8);
      ctx.beginPath();
      ctx.moveTo(W * 0.03, sectY + 3 * scale);
      ctx.lineTo(W * 0.97, sectY + 3 * scale);
      ctx.stroke();

      ctx.restore();
      break;
    }
  }
}

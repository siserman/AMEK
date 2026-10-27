// Draws every SKU's package art and shelf price tag into two texture atlases.
// Package cells are 128×128: the top 112 px are the label, the bottom 16 px hold
// four flat colour patches (base, accent, cap, fruit) for the untextured faces.
import * as THREE from '../../vendor/three.module.min.js';
import { canvas, tex, FONT, FONT_NARROW, fitFont, wrapText, drawLogo, roundRect, AMEK } from './textures.js';
import { euro, inkOn, luminance, shade } from '../util.js';
import { ean13Modules } from '../barcode.js';

const CELL = 128, LABEL_H = 112, COLS = 32;

export class ProductAtlas {
  constructor(data) {
    this.data = data;
    const n = data.products.length;
    this.rows = Math.ceil(n / COLS);
    this.W = COLS * CELL;
    this.H = this.rows * CELL;
    this.canvas = canvas(this.W, this.H);
    const g = this.canvas.getContext('2d');
    for (const p of data.products) this.drawCell(g, p);
    this.texture = tex(this.canvas);
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
  }

  cellXY(i) {
    return [(i % COLS) * CELL, Math.floor(i / COLS) * CELL];
  }

  label(p) {
    const [x, y] = this.cellXY(p.index);
    return { u0: (x + 1) / this.W, u1: (x + CELL - 1) / this.W, v0: 1 - (y + LABEL_H - 1) / this.H, v1: 1 - (y + 1) / this.H };
  }

  patch(p, k) {
    const [x, y] = this.cellXY(p.index);
    return [(x + 32 * k + 16) / this.W, 1 - (y + LABEL_H + 8) / this.H];
  }

  drawCell(g, p) {
    const [x, y] = this.cellXY(p.index);
    g.save();
    g.fillStyle = p.color;
    g.fillRect(x, y, CELL, CELL);
    const patches = [p.color, p.accent, p.cap, p.fruit];
    patches.forEach((c, k) => {
      g.fillStyle = c;
      g.fillRect(x + 32 * k, y + LABEL_H, 32, CELL - LABEL_H);
    });
    g.beginPath();
    g.rect(x, y, CELL, LABEL_H);
    g.clip();
    const aspect = labelAspect(p);
    // Lay the label out in a virtual box with the real face's aspect ratio, then
    // squash it into the cell; on the 3D face it stretches back to true proportions.
    let rot = false, Vw, Vh;
    if (aspect < 0.5) {
      rot = true;
      Vw = 100 / aspect; Vh = 100;
    } else {
      Vw = 100 * aspect; Vh = 100;
    }
    g.translate(x, y);
    if (rot) {
      g.scale(CELL / Vh, LABEL_H / Vw);
      g.translate(0, Vw);
      g.rotate(-Math.PI / 2);
    } else {
      g.scale(CELL / Vw, LABEL_H / Vh);
    }
    drawArt(g, p, this.data.brands[p.brand] || {}, Vw, Vh);
    g.restore();
  }
}

// Width/height of the face the label ends up on.
export function labelAspect(p) {
  const [w, h, d] = p.dim;
  const r = w / 2;
  const top = p.label === 'top' || p.label === 'both';
  switch (p.shape) {
    case 'tray': case 'round': return w / d;
    case 'can': return top ? 1 : (Math.PI * r) / (h * 0.9);
    case 'jar': return (Math.PI * r) / (h * 0.67);
    case 'tub': return top ? 1 : (Math.PI * r) / (h * 0.85);
    case 'bottle': return (Math.PI * r) / (h * 0.56);
    case 'wine': return (Math.PI * r) / (h * 0.57);
    case 'figure': return (Math.PI * r) / (h * 0.55);
    case 'carton': return w / (h * 0.82);
    case 'tetra': return w / (h * 0.93);
    case 'flatbottle': return w / (h * 0.82);
    case 'net': case 'pot': case 'bunch': case 'head': case 'piece': case 'loose': return 1.7;
    default: return top ? w / d : w / h;
  }
}

function inkFor(brand, bg) {
  const ink = brand.ink;
  if (!ink) return inkOn(bg);
  return Math.abs(luminance(ink) - luminance(bg)) < 0.3 ? inkOn(bg) : ink;
}

function drawArt(g, p, brand, W, H) {
  const style = p.tags.includes('bio') ? 'bio' : brand.style || 'band';
  const bg = p.color;
  g.fillStyle = bg;
  g.fillRect(-2, -2, W + 4, H + 4);
  const m = Math.min(W, H);
  const pad = m * 0.07;
  let nameTop = H * 0.3, nameBottom = H * 0.7;
  let ink = inkFor(brand, bg);
  const accent = p.accent;

  // Bottles and jars: the paper label is a band on the glass/liquid colour.
  if (['bottle', 'wine'].includes(p.shape)) {
    const lbg = p.shape === 'wine' ? '#f3ecd9' : accent;
    g.fillStyle = lbg;
    const y0 = H * 0.16, y1 = H * 0.88;
    g.fillRect(-2, y0, W + 4, y1 - y0);
    g.fillStyle = p.shape === 'wine' ? p.accent : shade(lbg, -0.25);
    g.fillRect(-2, y0, W + 4, H * 0.05);
    g.fillRect(-2, y1 - H * 0.05, W + 4, H * 0.05);
    ink = inkOn(lbg);
    if (p.shape === 'wine' && luminance(p.accent) < 0.4) ink = p.accent;
    return textBlock(g, p, W, H, ink, H * 0.22, H * 0.82, brand);
  }

  switch (style) {
    case 'meadow': {
      g.fillStyle = accent;
      g.fillRect(-2, -2, W + 4, H * 0.24);
      g.fillStyle = '#5a9a3a';
      g.beginPath();
      g.moveTo(-2, H * 0.88);
      g.quadraticCurveTo(W * 0.3, H * 0.74, W * 0.6, H * 0.84);
      g.quadraticCurveTo(W * 0.85, H * 0.9, W + 2, H * 0.8);
      g.lineTo(W + 2, H + 2);
      g.lineTo(-2, H + 2);
      g.fill();
      brandLine(g, p.brand, W / 2, H * 0.12, W * 0.9, H * 0.15, '#ffffff');
      nameTop = H * 0.28; nameBottom = H * 0.72;
      break;
    }
    case 'sticker': {
      // meat & fish: the product shows through the film, the label is a sticker
      g.fillStyle = p.fruit;
      g.fillRect(-2, -2, W + 4, H + 4);
      g.fillStyle = shade(p.fruit, -0.15);
      for (let i = 0; i < 7; i++) {
        g.beginPath();
        g.ellipse(W * ((i * 37) % 100) / 100, H * ((i * 61) % 100) / 100, W * 0.18, H * 0.08, i, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#ffffff';
      roundRect(g, W * 0.05, H * 0.08, W * 0.62, H * 0.5, m * 0.04);
      g.fill();
      g.fillStyle = accent;
      g.fillRect(W * 0.05, H * 0.08, W * 0.62, H * 0.12);
      brandLine(g, p.brand, W * 0.36, H * 0.14, W * 0.58, H * 0.1, '#ffffff');
      g.fillStyle = '#1a1a1a';
      const s = fitFont(g, p.name, W * 0.58, H * 0.12, 800, FONT_NARROW);
      const lines = wrapText(g, p.name, W * 0.58).slice(0, 2);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      lines.forEach((l, i) => g.fillText(l, W * 0.36, H * 0.3 + i * s * 1.05));
      g.font = `600 ${H * 0.08}px ${FONT}`;
      g.fillText(p.size, W * 0.36, H * 0.5);
      return;
    }
    case 'crate': {
      // produce tag: green card with name and origin
      g.fillStyle = accent;
      g.beginPath();
      g.arc(W * 0.86, H * 0.2, m * 0.13, 0, Math.PI * 2);
      g.fill();
      ink = '#ffffff';
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.font = `700 ${H * 0.12}px ${FONT}`;
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(p.origin ? 'Herkunft: ' + p.origin : 'Erntegut', pad, H * 0.86);
      nameTop = H * 0.12; nameBottom = H * 0.7;
      textName(g, p.name, W, nameTop, nameBottom, ink, pad);
      return;
    }
    case 'bio': {
      g.fillStyle = '#3d8b37';
      g.beginPath();
      g.arc(W - m * 0.2, m * 0.2, m * 0.15, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffffff';
      g.font = `900 ${m * 0.1}px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('BIO', W - m * 0.2, m * 0.2);
      g.fillStyle = accent;
      g.fillRect(-2, H * 0.78, W + 4, H * 0.24);
      brandLine(g, p.brand, W * 0.42, H * 0.13, W * 0.66, H * 0.13, inkFor({ ink: '#2e6b1f' }, bg));
      nameTop = H * 0.26; nameBottom = H * 0.74;
      break;
    }
    case 'tricolore': {
      const s = W / 3;
      [['#2e8b3a', 0], ['#ffffff', 1], ['#c8102e', 2]].forEach(([c, i]) => {
        g.fillStyle = c;
        g.fillRect(i * s, -2, s + 1, H * 0.08);
      });
      g.fillStyle = accent;
      g.fillRect(-2, H * 0.72, W + 4, H * 0.12);
      brandLine(g, p.brand, W / 2, H * 0.19, W * 0.86, H * 0.13, ink);
      nameTop = H * 0.3; nameBottom = H * 0.7;
      break;
    }
    case 'sun': {
      g.fillStyle = accent;
      g.beginPath();
      g.arc(W / 2, H * 1.0, m * 0.55, Math.PI, 0);
      g.fill();
      brandLine(g, p.brand, W / 2, H * 0.12, W * 0.86, H * 0.13, ink);
      nameTop = H * 0.24; nameBottom = H * 0.6;
      break;
    }
    case 'dark': {
      g.strokeStyle = accent;
      g.lineWidth = m * 0.04;
      g.strokeRect(pad, pad, W - 2 * pad, H - 2 * pad);
      g.fillStyle = accent;
      g.fillRect(-2, H * 0.62, W + 4, H * 0.1);
      brandLine(g, p.brand, W / 2, H * 0.18, W * 0.8, H * 0.12, '#f2d29a', 'italic 700');
      nameTop = H * 0.28; nameBottom = H * 0.6;
      break;
    }
    case 'choc': {
      g.fillStyle = accent;
      g.beginPath();
      g.moveTo(-2, H * 0.62);
      g.bezierCurveTo(W * 0.3, H * 0.52, W * 0.6, H * 0.76, W + 2, H * 0.6);
      g.lineTo(W + 2, H * 0.7);
      g.bezierCurveTo(W * 0.6, H * 0.86, W * 0.3, H * 0.62, -2, H * 0.72);
      g.fill();
      brandLine(g, p.brand, W / 2, H * 0.1, W * 0.8, H * 0.1, ink, 'italic 800');
      nameTop = H * 0.18; nameBottom = H * 0.5;
      break;
    }
    case 'fun': {
      g.fillStyle = accent;
      g.beginPath();
      const cx = W * 0.5, cy = H * 0.5, R = m * 0.46;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2, rr = i % 2 ? R : R * 0.78;
        g.lineTo(cx + Math.cos(a) * rr * (W / m) * 0.9, cy + Math.sin(a) * rr);
      }
      g.fill();
      brandLine(g, p.brand, W / 2, H * 0.1, W * 0.84, H * 0.12, inkOn(bg));
      ink = inkOn(accent);
      nameTop = H * 0.28; nameBottom = H * 0.72;
      break;
    }
    case 'frost': {
      const gr = g.createLinearGradient(0, 0, 0, H * 0.35);
      gr.addColorStop(0, '#bfe3f7');
      gr.addColorStop(1, bg);
      g.fillStyle = gr;
      g.fillRect(-2, -2, W + 4, H * 0.35);
      g.fillStyle = accent;
      g.fillRect(-2, H * 0.74, W + 4, H * 0.1);
      brandLine(g, p.brand, W / 2, H * 0.12, W * 0.8, H * 0.14, '#0f3d6e');
      nameTop = H * 0.3; nameBottom = H * 0.72;
      break;
    }
    case 'water': {
      g.fillStyle = accent;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(-2, H * (0.7 + i * 0.1));
        g.quadraticCurveTo(W * 0.25, H * (0.64 + i * 0.1), W * 0.5, H * (0.7 + i * 0.1));
        g.quadraticCurveTo(W * 0.75, H * (0.76 + i * 0.1), W + 2, H * (0.7 + i * 0.1));
        g.lineTo(W + 2, H * (0.74 + i * 0.1));
        g.quadraticCurveTo(W * 0.75, H * (0.8 + i * 0.1), W * 0.5, H * (0.74 + i * 0.1));
        g.quadraticCurveTo(W * 0.25, H * (0.68 + i * 0.1), -2, H * (0.74 + i * 0.1));
        g.fill();
      }
      brandLine(g, p.brand, W / 2, H * 0.14, W * 0.8, H * 0.16, accent);
      ink = accent;
      nameTop = H * 0.3; nameBottom = H * 0.62;
      break;
    }
    case 'beer': {
      g.fillStyle = accent;
      g.beginPath();
      g.ellipse(W / 2, H * 0.45, W * 0.38, H * 0.3, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = bg;
      g.beginPath();
      g.ellipse(W / 2, H * 0.45, W * 0.34, H * 0.26, 0, 0, Math.PI * 2);
      g.fill();
      brandLine(g, p.brand, W / 2, H * 0.08, W * 0.8, H * 0.1, accent);
      nameTop = H * 0.3; nameBottom = H * 0.6;
      ink = accent;
      break;
    }
    case 'clean': {
      g.fillStyle = accent;
      g.beginPath();
      g.moveTo(-2, H * 0.8);
      g.quadraticCurveTo(W * 0.5, H * 0.55, W + 2, H * 0.65);
      g.lineTo(W + 2, H + 2);
      g.lineTo(-2, H + 2);
      g.fill();
      brandLine(g, p.brand, W / 2, H * 0.12, W * 0.8, H * 0.14, ink);
      nameTop = H * 0.26; nameBottom = H * 0.62;
      break;
    }
    case 'leaf': {
      g.fillStyle = accent;
      g.beginPath();
      g.ellipse(W * 0.82, H * 0.22, m * 0.12, m * 0.22, 0.7, 0, Math.PI * 2);
      g.fill();
      brandLine(g, p.brand, W * 0.42, H * 0.12, W * 0.66, H * 0.13, ink);
      g.fillStyle = accent;
      g.fillRect(-2, H * 0.84, W + 4, H * 0.18);
      nameTop = H * 0.28; nameBottom = H * 0.74;
      break;
    }
    case 'xmas': {
      g.fillStyle = accent;
      for (let i = 0; i < 9; i++) star(g, (W * ((i * 41) % 100)) / 100, (H * ((i * 23) % 100)) / 100, m * 0.04);
      g.fillStyle = accent;
      g.fillRect(-2, H * 0.78, W + 4, H * 0.06);
      brandLine(g, p.brand, W / 2, H * 0.12, W * 0.84, H * 0.12, accent, 'italic 700');
      ink = '#ffffff';
      if (luminance(bg) > 0.5) ink = '#a61d24';
      nameTop = H * 0.26; nameBottom = H * 0.74;
      break;
    }
    case 'tool': {
      g.fillStyle = accent;
      for (let i = -2; i < 12; i++) {
        g.beginPath();
        g.moveTo(i * W * 0.12, H);
        g.lineTo(i * W * 0.12 + W * 0.06, H);
        g.lineTo(i * W * 0.12 + W * 0.12, H * 0.86);
        g.lineTo(i * W * 0.12 + W * 0.06, H * 0.86);
        g.fill();
      }
      brandLine(g, p.brand, W / 2, H * 0.12, W * 0.8, H * 0.15, '#111111', '900');
      nameTop = H * 0.28; nameBottom = H * 0.8;
      break;
    }
    case 'amek': {
      drawLogo(g, W * 0.25, H * 0.12, W * 0.5, W * 0.25);
      return;
    }
    default: {
      g.fillStyle = accent;
      g.fillRect(-2, H * 0.74, W + 4, H * 0.14);
      brandLine(g, p.brand, W / 2, H * 0.12, W * 0.86, H * 0.14, ink);
      nameTop = H * 0.26; nameBottom = H * 0.72;
    }
  }
  if (p.tags.includes('vegan')) {
    g.fillStyle = '#2e6b1f';
    g.beginPath();
    g.arc(W - m * 0.16, H - m * 0.16, m * 0.12, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.font = `800 ${m * 0.07}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('vegan', W - m * 0.16, H - m * 0.16);
  }
  textName(g, p.name, W, nameTop, nameBottom, ink, pad);
  g.fillStyle = ink;
  g.font = `600 ${Math.min(H * 0.09, W * 0.12)}px ${FONT}`;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.fillText(p.size, pad, H - pad * 0.8);
}

function textBlock(g, p, W, H, ink, top, bottom, brand) {
  const m = Math.min(W, H);
  brandLine(g, p.brand || '', W / 2, top + (bottom - top) * 0.12, W * 0.86, Math.min(H * 0.1, W * 0.14), ink, p.shape === 'wine' ? 'italic 700' : '800');
  textName(g, p.name, W, top + (bottom - top) * 0.25, bottom - (bottom - top) * 0.2, ink, m * 0.06);
  g.font = `600 ${Math.min(H * 0.07, W * 0.1)}px ${FONT}`;
  g.textAlign = 'center';
  g.fillText(p.size, W / 2, bottom - (bottom - top) * 0.06);
}

function brandLine(g, text, cx, cy, maxW, size, color, weight = '800') {
  if (!text) return;
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${weight} ${size}px ${FONT}`;
  let s = size;
  while (g.measureText(text).width > maxW && s > 2) {
    s *= 0.92;
    g.font = `${weight} ${s}px ${FONT}`;
  }
  g.fillText(text, cx, cy);
}

function textName(g, name, W, top, bottom, ink, pad) {
  const maxW = W - pad * 2;
  const h = bottom - top;
  let size = Math.min(h / 1.6, W * 0.2);
  let lines;
  for (;;) {
    g.font = `800 ${size}px ${FONT_NARROW}`;
    lines = wrapText(g, name, maxW);
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if ((lines.length * size * 1.08 <= h && widest <= maxW) || size < 3) break;
    size *= 0.9;
  }
  g.fillStyle = ink;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const total = lines.length * size * 1.08;
  lines.forEach((l, i) => g.fillText(l, W / 2, top + (h - total) / 2 + size * 0.54 + i * size * 1.08));
}

function star(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.fill();
}

// ---------------------------------------------------------------------------
// Shelf price tags, one per SKU. 256×128 cells, eight per row.
const TW = 256, TH = 128, TCOLS = 8;

export class TagAtlas {
  constructor(data) {
    const n = data.products.length;
    this.rows = Math.ceil(n / TCOLS);
    this.W = TW * TCOLS;
    this.H = TH * this.rows;
    this.canvas = canvas(this.W, this.H);
    const g = this.canvas.getContext('2d');
    data.products.forEach((p) => this.draw(g, p));
    this.texture = tex(this.canvas);
  }

  rect(p) {
    const x = (p.index % TCOLS) * TW, y = Math.floor(p.index / TCOLS) * TH;
    return { u0: x / this.W, u1: (x + TW) / this.W, v0: 1 - (y + TH) / this.H, v1: 1 - y / this.H };
  }

  draw(g, p) {
    const x = (p.index % TCOLS) * TW, y = Math.floor(p.index / TCOLS) * TH;
    const offer = !!p.was;
    g.save();
    g.translate(x, y);
    g.fillStyle = offer ? AMEK.amber : '#ffffff';
    g.fillRect(0, 0, TW, TH);
    g.fillStyle = offer ? AMEK.red : AMEK.petrol;
    g.fillRect(0, 0, 8, TH);
    g.fillStyle = '#141414';
    g.textAlign = 'left';
    g.textBaseline = 'top';
    g.font = `700 21px ${FONT_NARROW}`;
    const lines = wrapText(g, p.name, TW - 30).slice(0, 2);
    lines.forEach((l, i) => g.fillText(l, 16, 6 + i * 22));
    g.font = `500 17px ${FONT_NARROW}`;
    g.fillStyle = '#333';
    const sizeLine = p.loose ? 'lose · je kg' : p.size;
    g.fillText(sizeLine, 16, 50);
    // left lines at the price's height push it to the right
    let left = 124;
    if (p.grundpreis) {
      g.font = `500 15px ${FONT_NARROW}`;
      g.fillText(p.grundpreis, 16, 69);
      left = Math.max(left, 16 + g.measureText(p.grundpreis).width + 10);
    }
    if (p.pfand) {
      const t = 'zzgl. ' + euro(p.pfand) + ' Pfand';
      g.font = `600 15px ${FONT_NARROW}`;
      g.fillText(t, 16, p.grundpreis ? 85 : 69);
      left = Math.max(left, 16 + g.measureText(t).width + 10);
    }
    // the EAN-13 in a white box, bottom left, like on a real shelf label
    if (p.gtin) {
      const bits = ean13Modules(p.gtin), bx = 14, by = 103;
      g.fillStyle = '#ffffff';
      g.fillRect(bx - 4, by - 3, 103, 28);
      g.fillStyle = '#141414';
      for (let i = 0; i < 95; i++) {
        const guard = i < 3 || (i >= 45 && i < 50) || i >= 92;
        if (bits[i] === '1') g.fillRect(bx + i, by, 1, guard ? 17 : 14);
      }
      g.font = `500 8px ui-monospace, Menlo, monospace`;
      g.textBaseline = 'top';
      g.fillText(p.gtin.replace(/^(\d)(\d{6})(\d{6})$/, '$1 $2 $3'), bx + 6, by + 16);
    }
    g.textAlign = 'right';
    g.textBaseline = 'alphabetic';
    g.fillStyle = offer ? AMEK.red : '#141414';
    // the price takes what is left right of the barcode and those lines
    const price = euro(p.price);
    g.font = `900 54px ${FONT}`;
    const room = TW - 10 - left, wide = g.measureText(price).width;
    if (wide > room) g.font = `900 ${Math.floor((54 * room) / wide)}px ${FONT}`;
    g.fillText(price, TW - 10, TH - 14);
    if (offer) {
      g.font = `700 17px ${FONT}`;
      g.fillStyle = '#141414';
      g.fillText('statt ' + euro(p.was), TW - 10, 70);
      g.strokeStyle = '#141414';
      g.lineWidth = 2;
      const w = g.measureText(euro(p.was)).width;
      g.beginPath();
      g.moveTo(TW - 10 - w, 64);
      g.lineTo(TW - 10, 64);
      g.stroke();
    }
    g.restore();
  }
}

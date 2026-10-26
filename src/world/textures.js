// Canvas-drawn textures: the AMEK logo, floor tiles, asphalt, cart wire,
// signage. Nothing is loaded from disk.
import * as THREE from '../../vendor/three.module.min.js';
import { rng, inkOn, shade } from '../util.js';

export const FONT = '"Archivo", "Helvetica Neue", Arial, sans-serif';
export const FONT_NARROW = '"Archivo Narrow", "Arial Narrow", "Roboto Condensed", Arial, sans-serif';
export const AMEK = { petrol: '#0d5c63', petrolDark: '#083f44', amber: '#ffb000', cream: '#f6f1e7', red: '#d7263d' };

let maxAniso = 4;
export function setAnisotropy(a) {
  maxAniso = a;
}

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function tex(c, { repeat = null, srgb = true, mips = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  if (!mips) {
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
  }
  return t;
}

// The wordmark, drawn into any rect of a 2D context.
export function drawLogo(ctx, x, y, w, h, { plate = true } = {}) {
  ctx.save();
  if (plate) {
    ctx.fillStyle = AMEK.petrol;
    roundRect(ctx, x, y, w, h, h * 0.16);
    ctx.fill();
  }
  // amber sun rising behind the word
  ctx.fillStyle = AMEK.amber;
  ctx.beginPath();
  ctx.arc(x + w * 0.79, y + h * 0.36, h * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = h * 0.62;
  ctx.font = `900 ${size}px ${FONT}`;
  while (ctx.measureText('AMEK').width > w * 0.84 && size > 8) {
    size -= 2;
    ctx.font = `900 ${size}px ${FONT}`;
  }
  ctx.fillText('AMEK', x + w / 2, y + h * 0.5);
  ctx.fillStyle = AMEK.amber;
  ctx.fillRect(x + w * 0.16, y + h * 0.8, w * 0.68, h * 0.06);
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function logoTexture() {
  const c = canvas(512, 256);
  const g = c.getContext('2d');
  drawLogo(g, 0, 0, 512, 256);
  return tex(c);
}

export function floorTexture() {
  const c = canvas(512, 512);
  const g = c.getContext('2d');
  const r = rng(7);
  const n = 4; // 4×4 tiles of 60 cm on a 2.4 m texture
  const s = 512 / n;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v = 205 + Math.floor(r() * 14);
      g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      g.fillRect(i * s, j * s, s, s);
      for (let k = 0; k < 140; k++) {
        const q = v - 18 + Math.floor(r() * 36);
        g.fillStyle = `rgba(${q},${q},${q - 4},0.35)`;
        g.fillRect(i * s + r() * s, j * s + r() * s, 2, 2);
      }
    }
  }
  g.strokeStyle = 'rgba(120,118,112,0.55)';
  g.lineWidth = 2;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.stroke();
    g.beginPath(); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke();
  }
  return c;
}

export function asphaltTexture() {
  const c = canvas(512, 512);
  const g = c.getContext('2d');
  g.fillStyle = '#4a4c4f';
  g.fillRect(0, 0, 512, 512);
  const r = rng(11);
  for (let k = 0; k < 9000; k++) {
    const q = 50 + Math.floor(r() * 60);
    g.fillStyle = `rgba(${q},${q},${q + 3},0.5)`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
  }
  for (let k = 0; k < 6; k++) {
    g.strokeStyle = 'rgba(30,30,32,0.25)';
    g.lineWidth = 1 + r() * 2;
    g.beginPath();
    let x = r() * 512, y = r() * 512;
    g.moveTo(x, y);
    for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 80; y += (r() - 0.5) * 80; g.lineTo(x, y); }
    g.stroke();
  }
  return c;
}

export function paverTexture() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  const r = rng(5);
  for (let j = 0; j < 8; j++) {
    for (let i = 0; i < 4; i++) {
      const v = 168 + Math.floor(r() * 22);
      g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
      const off = j % 2 ? 32 : 0;
      g.fillRect(i * 64 + off - 64, j * 32, 62, 30);
      g.fillRect(i * 64 + off, j * 32, 62, 30);
    }
  }
  return c;
}

export function grassTexture() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#5f8a3a';
  g.fillRect(0, 0, 256, 256);
  const r = rng(3);
  for (let k = 0; k < 5000; k++) {
    const q = r();
    g.fillStyle = q < 0.5 ? 'rgba(70,110,40,0.6)' : 'rgba(130,160,70,0.5)';
    g.fillRect(r() * 256, r() * 256, 1, 2 + r() * 3);
  }
  return c;
}

// Wire mesh of the shopping cart (alpha-tested)
export function wireTexture() {
  const c = canvas(128, 128);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  g.strokeStyle = '#d8dde2';
  g.lineWidth = 3;
  for (let i = 0; i <= 128; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke();
  }
  const t = tex(c, { repeat: [4, 2] });
  return t;
}

export function beltTexture() {
  const c = canvas(64, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#1d1e20';
  g.fillRect(0, 0, 64, 256);
  g.fillStyle = '#2a2b2e';
  for (let y = 0; y < 256; y += 16) g.fillRect(0, y, 64, 6);
  return tex(c, { repeat: [1, 6] });
}

// A hanging aisle sign: big name, small sub-line, coloured edge.
export function signCanvas(title, sub, color) {
  const c = canvas(1024, 256);
  const g = c.getContext('2d');
  g.fillStyle = AMEK.petrol;
  g.fillRect(0, 0, 1024, 256);
  g.fillStyle = color || AMEK.amber;
  g.fillRect(0, 220, 1024, 36);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fitFont(g, title, 940, 120, 900, FONT);
  g.fillText(title, 512, sub ? 92 : 112);
  if (sub) {
    g.fillStyle = 'rgba(255,255,255,0.82)';
    fitFont(g, sub, 940, 54, 600, FONT);
    g.fillText(sub, 512, 172);
  }
  return c;
}

export function fitFont(g, text, maxW, size, weight, family) {
  g.font = `${weight} ${size}px ${family}`;
  while (g.measureText(text).width > maxW && size > 6) {
    size -= 2;
    g.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

export function wrapText(g, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width <= maxW || !line) line = t;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Poster for the shop window
export function posterCanvas(kind) {
  const c = canvas(512, 768);
  const g = c.getContext('2d');
  if (kind === 'broetchen') {
    g.fillStyle = AMEK.amber;
    g.fillRect(0, 0, 512, 768);
    g.fillStyle = '#5a3015';
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.ellipse(120 + (i % 3) * 140, 260 + Math.floor(i / 3) * 110, 62, 44, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#d9a35b';
      g.beginPath();
      g.ellipse(120 + (i % 3) * 140, 252 + Math.floor(i / 3) * 110, 56, 36, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#5a3015';
    }
    g.fillStyle = AMEK.petrol;
    g.textAlign = 'center';
    fitFont(g, 'Frisch aus dem Ofen', 460, 56, 900, FONT);
    g.fillText('Frisch aus dem Ofen', 256, 110);
    g.font = `900 180px ${FONT}`;
    g.fillText('0,19', 256, 590);
    g.font = `700 40px ${FONT}`;
    g.fillText('Weizenbrötchen, Stück', 256, 660);
  } else {
    g.fillStyle = AMEK.petrol;
    g.fillRect(0, 0, 512, 768);
    drawLogo(g, 106, 70, 300, 150, { plate: false });
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = `800 64px ${FONT}`;
    g.fillText('Frisch.', 256, 360);
    g.fillText('Günstig.', 256, 440);
    g.fillStyle = AMEK.amber;
    g.fillText('Um die Ecke.', 256, 520);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.font = `600 30px ${FONT}`;
    g.fillText('Mo–Sa 7–22 Uhr', 256, 650);
  }
  return c;
}

export function textPlate(text, { w = 512, h = 128, bg = AMEK.petrol, fg = '#ffffff', weight = 800 } = {}) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg || inkOn(bg);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fitFont(g, text, w * 0.9, h * 0.62, weight, FONT);
  g.fillText(text, w / 2, h / 2 + 2);
  return c;
}

export function parkingSignCanvas() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#1d5fae';
  roundRect(g, 0, 0, 256, 256, 26);
  g.fill();
  g.strokeStyle = '#ffffff';
  g.lineWidth = 10;
  roundRect(g, 12, 12, 232, 232, 18);
  g.stroke();
  g.fillStyle = '#ffffff';
  g.font = `900 200px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('P', 128, 138);
  return c;
}

export function skyTexture() {
  const c = canvas(4, 256);
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#5f97d6');
  gr.addColorStop(0.42, '#9ec4e8');
  gr.addColorStop(0.5, '#dfe9ef');
  gr.addColorStop(0.53, '#c9d3d3');
  gr.addColorStop(1, '#8f9a8f');
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  return tex(c);
}

export { shade };

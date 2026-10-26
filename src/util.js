// Small helpers shared by every module. Money is always integer cents.

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
// Frame-rate independent exponential smoothing.
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
export const TAU = Math.PI * 2;

export function wrapAngle(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}

export const cents = (euro) => Math.round(euro * 100);

// 1234 -> "12,34"
export function euro(c) {
  const neg = c < 0;
  const abs = Math.abs(Math.round(c));
  const s = Math.floor(abs / 100).toLocaleString('de-DE') + ',' + String(abs % 100).padStart(2, '0');
  return neg ? '-' + s : s;
}
export const euroSign = (c) => euro(c) + ' €';

export function kg(w) {
  return w.toFixed(3).replace('.', ',') + ' kg';
}

// Grundpreis per PAngV: since 2022 always per 1 kg / 1 l (or per m), never per 100 g.
export function grundpreis(p) {
  if (p.loose) return null; // the shelf price already is per kg
  const map = { g: ['kg', 1000], ml: ['l', 1000], kg: ['kg', 1], l: ['l', 1], m: ['m', 1] };
  const m = map[p.unit];
  if (!m || !p.qty) return null;
  const perBase = (p.price / p.qty) * m[1];
  return `1 ${m[0]} = ${euro(perBase)} €`;
}

// Deterministic PRNG so the parking lot and planograms look the same every visit.
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const inkOn = (bg) => (luminance(bg) > 0.42 ? '#161616' : '#ffffff');

export function shade(hex, f) {
  const [r, g, b] = hexToRgb(hex);
  const t = f < 0 ? 0 : 255;
  const k = Math.abs(f);
  const c = (v) => Math.round((t - v) * k + v);
  return '#' + [c(r), c(g), c(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export function fmtClock(d) {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

// Product geometry and the shelf stock system.
//
// Every SKU gets one small template mesh (origin at the bottom centre, front = +z)
// whose UVs point into the ProductAtlas. Shelves stamp thousands of copies into a
// handful of merged chunks; taking an item collapses its vertices, putting it
// back restores them. Picking is a ray against per-item boxes in a 1 m grid.
import * as THREE from '../../vendor/three.module.min.js';
import { GeoBuilder, arraysToGeometry } from './geo.js';
import { clamp, rng } from '../util.js';

const SEG = 8;

export function buildTemplate(p, A) {
  const B = new GeoBuilder({ uv: true });
  const L = A.label(p);
  const P = (k) => A.patch(p, k);
  const [w, h, d] = p.dim;
  const r = w / 2;
  const top = p.label === 'top' || p.label === 'both';
  const lu = (y0, y1) => (th, y) => {
    const u = clamp((th + Math.PI / 2) / Math.PI, 0, 1);
    const v = clamp((y - y0) / (y1 - y0), 0, 1);
    return [L.u0 + (L.u1 - L.u0) * u, L.v0 + (L.v1 - L.v0) * v];
  };
  const discL = (x, z) => [L.u0 + (L.u1 - L.u0) * (0.5 + x / 2), L.v0 + (L.v1 - L.v0) * (0.5 - z / 2)];
  const R = rng(p.index * 977 + 13);

  switch (p.shape) {
    case 'carton': {
      const h1 = h * 0.82, yr = h * 0.97, x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
      B.box(0, 0, 0, w, h1, d, { uv: { front: L, other: P(0) }, skip: { top: true } });
      B.quad([x0, h1, z1], [x1, h1, z1], [x1, yr, 0], [x0, yr, 0], P(1));
      B.quad([x1, h1, z0], [x0, h1, z0], [x0, yr, 0], [x1, yr, 0], P(0));
      B.tri([x0, h1, z0], [x0, h1, z1], [x0, yr, 0], P(0));
      B.tri([x1, h1, z1], [x1, h1, z0], [x1, yr, 0], P(0));
      B.box(0, yr - 0.002, 0, w, h - yr + 0.002, 0.006, { uv: { other: P(0) } });
      B.cylinder(w * 0.18, h1 + (yr - h1) * 0.3, d * 0.2, Math.min(w, d) * 0.17, 0.014, 8, { side: P(2) });
      break;
    }
    case 'tetra': {
      const h1 = h * 0.93;
      B.box(0, 0, 0, w, h1, d, { uv: { front: L, other: P(0) } });
      B.cylinder(w * 0.12, h1, d * 0.18, Math.min(w, d) * 0.2, h - h1, 10, { side: P(2) });
      break;
    }
    case 'bag': {
      if (top) {
        B.box(0, 0, 0, w, h, d, { uv: { top: L, front: P(1), other: P(0) } });
        break;
      }
      const zt = d * 0.18, x0 = -w / 2, x1 = w / 2, yt = h * 0.93;
      B.quad([x0, 0, d / 2], [x1, 0, d / 2], [x1, yt, zt], [x0, yt, zt], L);
      B.quad([x1, 0, -d / 2], [x0, 0, -d / 2], [x0, yt, -zt], [x1, yt, -zt], P(0));
      B.quad([x1, 0, d / 2], [x1, 0, -d / 2], [x1, yt, -zt], [x1, yt, zt], P(0));
      B.quad([x0, 0, -d / 2], [x0, 0, d / 2], [x0, yt, zt], [x0, yt, -zt], P(0));
      B.quad([x0, 0, -d / 2], [x1, 0, -d / 2], [x1, 0, d / 2], [x0, 0, d / 2], P(0));
      B.box(0, yt, 0, w, h - yt, zt * 2, { uv: { other: P(1) } });
      break;
    }
    case 'tray': {
      if (p.fruitShape) {
        B.box(0, 0, 0, w, h * 0.4, d, { uv: { other: P(0) } });
        pile(B, p, w * 0.9, d * 0.85, h * 0.4, h * 0.6, P(3), R);
        tag(B, w, h * 0.05, d / 2 + 0.002, L);
      } else {
        B.box(0, 0, 0, w, h, d, { uv: { top: L, other: P(0) } });
      }
      break;
    }
    case 'can': {
      if (top) {
        B.lathe([[r, 0], [r, h]], SEG, () => P(0));
        disc(B, h, r, discL, 16, true);
      } else {
        B.lathe([[r * 0.92, 0], [r, h * 0.04], [r, h * 0.94], [r * 0.9, h]], SEG, lu(h * 0.04, h * 0.94));
        disc(B, h, r * 0.9, () => P(2), SEG, true);
      }
      disc(B, 0, r * 0.92, () => P(2), SEG, false);
      break;
    }
    case 'jar': {
      B.lathe([[r * 0.95, 0], [r, h * 0.03], [r, h * 0.8], [r * 0.88, h * 0.86]], SEG, lu(h * 0.1, h * 0.77));
      B.cylinder(0, h * 0.86, 0, r * 0.93, h * 0.14, SEG, { side: P(2) });
      disc(B, 0, r * 0.95, () => P(0), SEG, false);
      break;
    }
    case 'tub': {
      const yr = h * 0.92;
      if (top) {
        B.lathe([[r * 0.85, 0], [r, yr]], SEG, () => P(0));
        B.lathe([[r, yr], [r * 1.03, yr + h * 0.02], [r * 1.03, h]], SEG, () => P(2));
        disc(B, h, r * 1.03, discL, 16, true);
      } else {
        B.lathe([[r * 0.85, 0], [r, yr]], SEG, lu(0, yr));
        B.lathe([[r, yr], [r * 1.03, yr + h * 0.02], [r * 1.03, h]], SEG, () => P(0));
        disc(B, h, r * 1.03, () => P(2), SEG, true);
      }
      disc(B, 0, r * 0.85, () => P(0), SEG, false);
      break;
    }
    case 'bottle': {
      B.lathe([[r * 0.95, 0], [r, h * 0.04], [r, h * 0.6]], SEG, lu(h * 0.04, h * 0.6));
      B.lathe([[r, h * 0.6], [r * 0.9, h * 0.68], [r * 0.45, h * 0.78], [r * 0.36, h * 0.88]], SEG, () => P(0));
      B.cylinder(0, h * 0.88, 0, r * 0.42, h * 0.12, 10, { side: P(2) });
      disc(B, 0, r * 0.95, () => P(0), SEG, false);
      break;
    }
    case 'wine': {
      B.lathe([[r * 0.96, 0], [r, h * 0.03], [r, h * 0.6]], SEG, lu(h * 0.03, h * 0.6));
      B.lathe([[r, h * 0.6], [r * 0.8, h * 0.68], [r * 0.34, h * 0.76], [r * 0.3, h * 0.84]], SEG, () => P(0));
      B.cylinder(0, h * 0.84, 0, r * 0.32, h * 0.16, 10, { side: P(2) });
      disc(B, 0, r * 0.96, () => P(0), SEG, false);
      break;
    }
    case 'figure': {
      B.lathe([[r, 0], [r * 0.98, h * 0.05], [r * 0.92, h * 0.45], [r * 0.6, h * 0.6]], SEG, lu(h * 0.05, h * 0.6));
      B.lathe([[r * 0.6, h * 0.6], [r * 0.66, h * 0.7], [r * 0.5, h * 0.82], [r * 0.22, h * 0.95], [0, h]], SEG, () => P(2));
      disc(B, 0, r, () => P(0), SEG, false);
      break;
    }
    case 'round': {
      B.lathe([[r, 0], [r, h]], 16, () => P(0));
      disc(B, h, r, discL, 18, true);
      disc(B, 0, r, () => P(0), 16, false);
      break;
    }
    case 'flatbottle': {
      B.box(0, 0, 0, w, h * 0.82, d, { uv: { front: L, other: P(0) } });
      B.box(0, h * 0.82, 0, w * 0.75, h * 0.06, d * 0.8, { uv: { other: P(0) } });
      B.box(0, h * 0.88, 0, w * 0.38, h * 0.12, d * 0.55, { uv: { other: P(2) } });
      break;
    }
    case 'pack': {
      const hb = h * 0.84;
      B.box(0, 0, 0, w, hb, d, { uv: { front: L, other: P(0) } });
      for (let i = -1; i <= 1; i++) {
        for (const j of [-0.5, 0.5]) {
          const x = (i * w) / 3, z = (j * d) / 2;
          B.box(x, hb, z, 0.045, h * 0.08, 0.045, { uv: { other: P(0) } });
          B.box(x, hb + h * 0.08, z, 0.03, h * 0.08, 0.03, { uv: { other: P(2) } });
        }
      }
      break;
    }
    case 'crate': {
      B.box(0, 0, 0, w, h, d, { uv: { front: L, top: P(2), other: P(0) } });
      B.box(0, h * 0.75, d / 2 + 0.004, w * 0.3, h * 0.08, 0.01, { uv: { other: P(2) } });
      break;
    }
    case 'net': {
      pile(B, p, w, d, 0, h, P(3), R);
      B.box(0, h * 0.85, 0, 0.02, h * 0.15, 0.02, { uv: { other: P(2) } });
      tag(B, w, h * 0.12, d / 2 + 0.004, L);
      break;
    }
    case 'loose': {
      const kind = p.fruitShape, fr = p.fruitSize;
      const n = kind === 'long' ? 2 : kind === 'pear' && fr < 0.03 ? 1 : 4;
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? 0 : (i % 2 - 0.5) * fr * 2.1;
        const z = n <= 2 ? (kind === 'long' ? (i - 0.5) * fr * 2.2 : 0) : (Math.floor(i / 2) - 0.5) * fr * 2.1;
        fruit(B, kind, x, fr, z, fr, P(3), R);
      }
      if (n === 4 && kind !== 'long') fruit(B, kind, 0, fr * 2.6, 0, fr, P(3), R);
      break;
    }
    case 'bunch': {
      bananas(B, p.fruitSize, P(3), P(0));
      break;
    }
    case 'piece': {
      fruit(B, p.fruitShape, 0, p.fruitSize, 0, p.fruitSize, P(3), R);
      break;
    }
    case 'head': {
      const fr = p.fruitSize;
      B.ellipsoid(0, fr * 0.85, 0, fr, fr * 0.85, fr, P(3), 10, 7);
      if (p.id === 'hokkaido') B.box(0, fr * 1.6, 0, 0.012, 0.03, 0.012, { uv: { other: P(0) } });
      break;
    }
    case 'pot': {
      const hp = h * 0.42;
      B.lathe([[r * 0.7, 0], [r * 0.92, hp], [r * 0.98, hp + 0.01]], SEG, () => P(2));
      disc(B, hp, r * 0.92, () => P(0), SEG, true);
      B.ellipsoid(0, hp + r * 0.7, 0, r * 1.05, r * 0.72, r * 1.05, P(3), 10, 6);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        B.ellipsoid(Math.sin(a) * r * 0.55, hp + r * (1.0 + R() * 0.3), Math.cos(a) * r * 0.55, r * 0.5, r * 0.45, r * 0.5, P(3), 7, 5);
      }
      tag(B, w * 0.9, hp * 0.4, r * 0.95, L);
      break;
    }
    case 'bun': {
      B.ellipsoid(0, h * 0.48, 0, w / 2, h * 0.48, d / 2, P(0), 8, 5);
      B.ellipsoid(0, h * 0.66, 0, w * 0.4, h * 0.32, d * 0.38, P(2), 6, 3);
      break;
    }
    case 'brezel': {
      B.torus(-w * 0.12, h * 0.45, 0, w * 0.2, h * 0.42, P(0), 10, 5, 0.85);
      B.torus(w * 0.12, h * 0.45, 0, w * 0.2, h * 0.42, P(0), 10, 5, 0.85);
      break;
    }
    case 'croissant': {
      B.ellipsoid(0, h * 0.5, 0, w * 0.24, h * 0.5, d * 0.45, P(0), 8, 5);
      B.ellipsoid(-w * 0.27, h * 0.38, -d * 0.12, w * 0.2, h * 0.36, d * 0.3, P(0), 6, 4);
      B.ellipsoid(w * 0.27, h * 0.38, -d * 0.12, w * 0.2, h * 0.36, d * 0.3, P(0), 6, 4);
      break;
    }
    case 'loaf': {
      B.ellipsoid(0, h * 0.5, 0, w / 2, h / 2, d / 2, P(0), 12, 7);
      B.ellipsoid(0, h * 0.94, 0, w * 0.36, h * 0.08, d * 0.26, P(2), 8, 4);
      break;
    }
    case 'baguette': {
      B.ellipsoid(0, h * 0.5, 0, w / 2, h / 2, d / 2, P(0), 10, 5);
      for (let i = -1; i <= 1; i++) B.ellipsoid(i * w * 0.25, h * 0.93, 0, w * 0.07, h * 0.08, d * 0.12, P(2), 5, 3);
      break;
    }
    default: {
      // 'box'
      const uv = { other: P(0) };
      uv.front = p.label === 'top' ? P(1) : L;
      if (top) uv.top = L;
      B.box(0, 0, 0, w, h, d, { uv });
    }
  }
  return B.toArrays();
}

function disc(B, y, r, uvFn, segs, up) {
  const c = B.v(0, y, 0, 0, up ? 1 : -1, 0, ...uvFn(0, 0));
  for (let i = 0; i <= segs; i++) {
    const th = -Math.PI + (2 * Math.PI * i) / segs;
    const x = Math.sin(th), z = Math.cos(th);
    B.v(r * x, y, r * z, 0, up ? 1 : -1, 0, ...uvFn(x, z));
  }
  for (let i = 0; i < segs; i++) {
    if (up) B.idx.push(c, c + 1 + i, c + 2 + i);
    else B.idx.push(c, c + 2 + i, c + 1 + i);
  }
}

// A small price/produce tag standing at the front of a pack
function tag(B, w, y, z, L) {
  const tw = Math.min(0.09, w * 0.6), th = tw / 1.7;
  B.quad([-tw / 2, y, z], [tw / 2, y, z], [tw / 2, y + th, z], [-tw / 2, y + th, z], L);
}

function fruit(B, kind, x, y, z, r, uv, R) {
  const j = () => 0.9 + R() * 0.2;
  switch (kind) {
    case 'long':
      B.ellipsoid(x, y, z, r * 4.2, r * j(), r, uv, 10, 5);
      break;
    case 'pear':
      B.ellipsoid(x, y, z, r, r * 0.95, r, uv, 8, 5);
      B.ellipsoid(x, y + r * 0.95, z, r * 0.62, r * 0.7, r * 0.62, uv, 7, 4);
      break;
    case 'small':
      B.ellipsoid(x, y, z, r, r, r, uv, 4, 3);
      break;
    case 'head':
      B.ellipsoid(x, y, z, r, r * 0.85, r, uv, 9, 6);
      break;
    case 'banana':
      B.ellipsoid(x, y, z, r * 0.95, r * 0.18, r * 0.2, uv, 8, 4);
      break;
    default:
      B.ellipsoid(x, y, z, r * j(), r * 0.92, r * j(), uv, 6, 4);
  }
}

// Fruit piled into a w×d footprint, from y0 up to y1.
function pile(B, p, w, d, y0, y1, uv, R) {
  const kind = p.fruitShape, fr = p.fruitSize;
  if (kind === 'long') {
    const len = fr * 8.4;
    const nz = Math.max(1, Math.floor(d / (fr * 2.1)));
    const layers = Math.max(1, Math.min(3, Math.floor((y1 - y0) / (fr * 1.8))));
    const xoff = Math.max(0, (w - len) / 2);
    for (let l = 0; l < layers; l++)
      for (let k = 0; k < nz; k++)
        fruit(B, kind, (R() - 0.5) * xoff, y0 + fr + l * fr * 1.8, -d / 2 + fr + k * fr * 2.1 + (l % 2) * fr * 0.5, fr, uv, R);
    return;
  }
  const s = fr * 2.05;
  const nx = Math.max(1, Math.floor(w / s)), nz = Math.max(1, Math.floor(d / s));
  const layers = Math.max(1, Math.round((y1 - y0) / (fr * 1.75)));
  let count = 0;
  const max = kind === 'small' ? 20 : p.shape === 'net' ? 7 : 12;
  for (let l = 0; l < layers && count < max; l++) {
    const shrink = l * 0.5;
    for (let i = 0; i < nx - shrink && count < max; i++) {
      for (let k = 0; k < nz - shrink && count < max; k++) {
        const x = -w / 2 + fr + (i + shrink / 2) * s + (R() - 0.5) * fr * 0.3;
        const z = -d / 2 + fr + (k + shrink / 2) * s + (R() - 0.5) * fr * 0.3;
        fruit(B, kind, x, y0 + fr * 0.95 + l * fr * 1.7, z, fr, uv, R);
        count++;
      }
    }
  }
}

function bananas(B, len, uv, stemUv) {
  const m = new THREE.Matrix4();
  const old = B.m;
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.16;
    m.makeRotationY(a).premultiply(new THREE.Matrix4().makeTranslation(0, 0.02 + Math.abs(i - 2) * 0.004, (i - 2) * 0.022));
    m.multiply(new THREE.Matrix4().makeRotationZ(0.18));
    B.m = old ? old.clone().multiply(m) : m;
    B.ellipsoid(len * 0.15, 0, 0, len * 0.95, len * 0.18, len * 0.2, uv, 8, 4);
  }
  B.m = old;
  B.box(-len * 0.75, 0.005, 0, 0.03, 0.02, 0.03, { uv: { other: stemUv } });
}

// Loose produce shown as a full crate on the display.
export function buildCrateDisplay(p, A, cw, ch, cd) {
  const B = new GeoBuilder({ uv: true });
  const P = (k) => A.patch(p, k);
  const L = A.label(p);
  const t = 0.012;
  B.box(0, 0, 0, cw, 0.02, cd, { uv: { other: P(0) } });
  B.box(0, 0, cd / 2 - t / 2, cw, ch, t, { uv: { other: P(0) } });
  B.box(0, 0, -cd / 2 + t / 2, cw, ch, t, { uv: { other: P(0) } });
  B.box(cw / 2 - t / 2, 0, 0, t, ch, cd, { uv: { other: P(0) } });
  B.box(-cw / 2 + t / 2, 0, 0, t, ch, cd, { uv: { other: P(0) } });
  const R = rng(p.index * 31 + 7);
  if (p.fruitShape === 'banana') {
    const old = B.m;
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 2; k++) {
        const m = new THREE.Matrix4().makeTranslation(-cw / 4 + (k * cw) / 2 * 0.95, 0.03 + (i % 2) * 0.04, -cd / 2 + 0.06 + i * (cd - 0.1) / 2.5);
        m.multiply(new THREE.Matrix4().makeRotationY((R() - 0.5) * 0.6));
        B.m = m;
        bananas(B, p.fruitSize, P(3), P(1));
      }
    }
    B.m = old;
  } else {
    pile(B, p, cw - 2 * t, cd - 2 * t, 0.02, ch + p.fruitSize * 1.5, P(3), R);
  }
  tag(B, cw, ch * 0.2, cd / 2 + 0.003, L);
  return B.toArrays();
}

// ---------------------------------------------------------------------------

export class ProductSystem {
  constructor(data, atlas, scene) {
    this.data = data;
    this.atlas = atlas;
    this.scene = scene;
    this.templates = new Map();
    this.geos = new Map();
    this.material = new THREE.MeshStandardMaterial({ map: atlas.texture, roughness: 0.55, metalness: 0 });
    this.instances = [];
    this.slots = [];
    this.grid = new Map();
    this.cur = null;
    this.stamp = 0;
    this.chunks = [];
  }

  template(p) {
    let t = this.templates.get(p.index);
    if (!t) {
      t = buildTemplate(p, this.atlas);
      this.templates.set(p.index, t);
    }
    return t;
  }

  // A standalone mesh of one item (cart contents, belt, hands).
  mesh(p) {
    let g = this.geos.get(p.index);
    if (!g) {
      g = arraysToGeometry(this.template(p));
      this.geos.set(p.index, g);
    }
    const m = new THREE.Mesh(g, this.material);
    m.castShadow = false;
    m.userData.sku = p.id;
    return m;
  }

  slot(p, info = {}) {
    const s = { id: this.slots.length, p, instances: [], kind: info.kind || 'units', stock: info.stock ?? 0, box: null, fixture: info.fixture || '', section: p.section };
    this.slots.push(s);
    return s;
  }

  setSlotBox(slot, box) {
    slot.box = box;
    this.index({ slotRef: slot, box });
  }

  begin(name) {
    this.cur = { name, items: [] };
  }

  add(slot, p, matrix, col = 0, order = 0, tpl = null) {
    const t = tpl || this.template(p);
    const box = transformBox(t.bbox, matrix);
    const rec = { id: this.instances.length, slot, p, tpl: t, matrix: matrix.clone(), col, order, visible: true, chunk: this.cur, vStart: 0, box, bulk: !!tpl };
    this.cur.items.push(rec);
    this.instances.push(rec);
    slot.instances.push(rec);
    this.index({ inst: rec, box });
    return rec;
  }

  // Shelf boards, back panels: things a pick ray must not pass through.
  blocker(box) {
    this.index({ blocker: true, box });
  }

  end() {
    const items = this.cur.items;
    if (!items.length) return null;
    let nv = 0, ni = 0;
    for (const it of items) {
      nv += it.tpl.pos.length / 3;
      ni += it.tpl.idx.length;
    }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
    const idx = new Uint32Array(ni);
    let vo = 0, io = 0;
    const nm = new THREE.Matrix3();
    for (const it of items) {
      const t = it.tpl, e = it.matrix.elements;
      nm.getNormalMatrix(it.matrix);
      const n = nm.elements;
      it.vStart = vo;
      it.vCount = t.pos.length / 3;
      for (let i = 0; i < t.pos.length; i += 3) {
        const x = t.pos[i], y = t.pos[i + 1], z = t.pos[i + 2];
        const o = vo * 3 + i;
        pos[o] = e[0] * x + e[4] * y + e[8] * z + e[12];
        pos[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
        pos[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        const nx = t.nor[i], ny = t.nor[i + 1], nz = t.nor[i + 2];
        nor[o] = n[0] * nx + n[3] * ny + n[6] * nz;
        nor[o + 1] = n[1] * nx + n[4] * ny + n[7] * nz;
        nor[o + 2] = n[2] * nx + n[5] * ny + n[8] * nz;
      }
      uv.set(t.uv, vo * 2);
      for (let i = 0; i < t.idx.length; i++) idx[io + i] = t.idx[i] + vo;
      vo += it.vCount;
      io += t.idx.length;
    }
    const g = new THREE.BufferGeometry();
    const pa = new THREE.BufferAttribute(pos, 3);
    pa.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', pa);
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, this.material);
    mesh.receiveShadow = true;
    mesh.name = 'products:' + this.cur.name;
    this.cur.mesh = mesh;
    this.cur.base = pos.slice();
    this.chunks.push(this.cur);
    this.scene.add(mesh);
    this.cur = null;
    return mesh;
  }

  index(entry) {
    const b = entry.box;
    for (let ix = Math.floor(b[0]); ix <= Math.floor(b[3]); ix++) {
      for (let iz = Math.floor(b[2]); iz <= Math.floor(b[5]); iz++) {
        const k = ix * 4096 + iz;
        let cell = this.grid.get(k);
        if (!cell) this.grid.set(k, (cell = []));
        cell.push(entry);
      }
    }
  }

  // Nearest hit along the ray: { inst } for an item, { slot } for an empty shelf spot.
  pick(o, dir, maxDist) {
    this.stamp++;
    let item = null, tItem = maxDist, slot = null, tSlot = maxDist, tBlock = maxDist;
    const steps = Math.ceil(maxDist / 0.12);
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * maxDist;
      const x = o.x + dir.x * t, z = o.z + dir.z * t;
      const cell = this.grid.get(Math.floor(x) * 4096 + Math.floor(z));
      if (!cell) continue;
      for (const e of cell) {
        if (e.stamp === this.stamp) continue;
        e.stamp = this.stamp;
        if (e.inst && !e.inst.visible) continue;
        const hit = rayBox(o, dir, e.box);
        if (hit === null) continue;
        if (e.blocker) tBlock = Math.min(tBlock, hit);
        else if (e.inst && hit < tItem) { tItem = hit; item = e.inst; }
        else if (e.slotRef && hit < tSlot) { tSlot = hit; slot = e.slotRef; }
      }
    }
    // items win over the empty-slot volume they stand in
    if (item && tItem < tBlock) return { inst: item, slot: item.slot, dist: tItem };
    if (slot && tSlot < tBlock) return { inst: null, slot, dist: tSlot };
    return null;
  }

  // Front-most visible item of the column the given item stands in.
  frontOf(rec) {
    let best = rec.bulk ? null : rec;
    for (const it of rec.slot.instances) {
      if (it.bulk || !it.visible) continue;
      if (rec.bulk ? !best || it.order < best.order : it.col === rec.col && it.order < best.order) best = it;
    }
    return best;
  }

  frontOfSlot(slot) {
    if (slot.kind === 'bulk') return slot.instances[0] || null;
    let best = null;
    for (const it of slot.instances) if (!it.bulk && it.visible && (!best || it.order < best.order)) best = it;
    return best;
  }

  hide(rec) {
    if (rec.bulk || !rec.visible) return;
    rec.visible = false;
    const attr = rec.chunk.mesh.geometry.attributes.position;
    const a = attr.array;
    const s = rec.vStart * 3, n = rec.vCount * 3;
    const x = a[s], y = a[s + 1], z = a[s + 2];
    for (let i = s; i < s + n; i += 3) {
      a[i] = x; a[i + 1] = y; a[i + 2] = z;
    }
    this.dirty(rec.chunk, s, n);
  }

  show(rec) {
    if (rec.visible) return;
    rec.visible = true;
    const attr = rec.chunk.mesh.geometry.attributes.position;
    const s = rec.vStart * 3, n = rec.vCount * 3;
    attr.array.set(rec.chunk.base.subarray(s, s + n), s);
    this.dirty(rec.chunk, s, n);
  }

  // Upload changed vertex ranges; inside a batch (the simulation moves hundreds
  // of packs per frame) a chunk with many changes is uploaded in one go.
  dirty(chunk, start, count) {
    if (this.batch) {
      (chunk.ranges = chunk.ranges || []).push(start, count);
      this.batch.add(chunk);
      return;
    }
    const attr = chunk.mesh.geometry.attributes.position;
    attr.addUpdateRange(start, count);
    attr.needsUpdate = true;
  }
  beginBatch() {
    this.batch = new Set();
  }
  endBatch() {
    const set = this.batch;
    this.batch = null;
    if (!set) return;
    for (const chunk of set) {
      const attr = chunk.mesh.geometry.attributes.position;
      const r = chunk.ranges;
      if (r.length <= 64) for (let i = 0; i < r.length; i += 2) attr.addUpdateRange(r[i], r[i + 1]);
      else attr.clearUpdateRanges();
      attr.needsUpdate = true;
      chunk.ranges = [];
    }
  }

  // Take one unit from a slot (via the item that was aimed at). Returns true on success.
  take(rec) {
    const slot = rec.slot;
    if (slot.kind === 'bulk') {
      if (slot.stock <= 0) return false;
      slot.stock--;
      return true;
    }
    // aiming at a crate means taking whatever lies on top
    const front = this.frontOf(rec);
    if (!front) return false;
    this.hide(front);
    return true;
  }

  // Put one unit back, preferring the slot aimed at.
  putBack(p, slot) {
    const slots = [slot, ...this.slots.filter((s) => s.p === p && s !== slot)].filter((s) => s && s.p === p);
    for (const s of slots) {
      if (s.kind === 'bulk') {
        s.stock++;
        return s;
      }
      // the hidden item furthest back in the fullest-hidden column goes back first
      let cand = null;
      for (const it of s.instances) if (!it.bulk && !it.visible && (!cand || it.order > cand.order)) cand = it;
      if (cand) {
        this.show(cand);
        return s;
      }
    }
    return null;
  }

  slotsOf(p) {
    return this.slots.filter((s) => s.p === p);
  }
}

function transformBox(bb, m) {
  const out = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  const v = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    v.set(i & 1 ? bb[3] : bb[0], i & 2 ? bb[4] : bb[1], i & 4 ? bb[5] : bb[2]).applyMatrix4(m);
    out[0] = Math.min(out[0], v.x); out[1] = Math.min(out[1], v.y); out[2] = Math.min(out[2], v.z);
    out[3] = Math.max(out[3], v.x); out[4] = Math.max(out[4], v.y); out[5] = Math.max(out[5], v.z);
  }
  return out;
}

export function rayBox(o, d, b) {
  let t0 = 0, t1 = Infinity;
  const os = [o.x, o.y, o.z], ds = [d.x, d.y, d.z];
  for (let k = 0; k < 3; k++) {
    const lo = b[k], hi = b[k + 3];
    if (Math.abs(ds[k]) < 1e-9) {
      if (os[k] < lo || os[k] > hi) return null;
      continue;
    }
    let ta = (lo - os[k]) / ds[k], tb = (hi - os[k]) / ds[k];
    if (ta > tb) [ta, tb] = [tb, ta];
    if (ta > t0) t0 = ta;
    if (tb < t1) t1 = tb;
    if (t0 > t1) return null;
  }
  return t0;
}

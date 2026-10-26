// Store fixtures and the planogram that stocks them.
//
// A "side" is one shopping face of a fixture: an origin at its back-left corner
// (as seen by a shopper standing in front of it), a facing angle and a length.
// Local coordinates: u runs left→right along the face, t from the front edge
// (0) back into the fixture, y up.
import * as THREE from '../../vendor/three.module.min.js';
import { buildCrateDisplay } from './products.js';
import { rng } from '../util.js';

export const COL = {
  shelf: '#d3d7db', plinth: '#61676d', back: '#e9ebec', upright: '#9aa1a8', strip: '#f3f4f5',
  chillBody: '#f1f3f4', chillIn: '#d9e1e6', petrol: '#0d5c63', amber: '#ffb000',
  freezer: '#e7eaed', freezerIn: '#cfe3f1', wood: '#9c7550', woodDark: '#6e4f33', crate: '#2f6b2a',
  pallet: '#c4a273', bin: '#5d6b75', stand: '#4a5157', standBase: '#33383d',
};

export class Side {
  constructor(ox, oz, theta, length, depth) {
    this.ox = ox; this.oz = oz; this.theta = theta; this.length = length; this.depth = depth;
    this.ax = Math.round(Math.cos(theta) * 1e6) / 1e6;
    this.az = Math.round(-Math.sin(theta) * 1e6) / 1e6;
    this.fx = Math.round(Math.sin(theta) * 1e6) / 1e6;
    this.fz = Math.round(Math.cos(theta) * 1e6) / 1e6;
  }
  world(u, y, t) {
    const f = this.depth - t;
    return [this.ox + this.ax * u + this.fx * f, y, this.oz + this.az * u + this.fz * f];
  }
  // axis-aligned world rectangle of a local u/t range
  rect(u0, u1, t0, t1) {
    const a = this.world(u0, 0, t0), b = this.world(u1, 0, t1);
    return [Math.min(a[0], b[0]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[2], b[2])];
  }
  box(B, u0, u1, y0, y1, t0, t1) {
    const r = this.rect(u0, u1, t0, t1);
    B.boxMM(r[0], y0, r[1], r[2], y1, r[3]);
  }
  aabb(u0, u1, y0, y1, t0, t1) {
    const r = this.rect(u0, u1, t0, t1);
    return [r[0], y0, r[1], r[2], y1, r[3]];
  }
  matrix(u, y, t, { yaw = 0, tilt = 0 } = {}) {
    const [x, , z] = this.world(u, y, t);
    const m = new THREE.Matrix4().makeTranslation(x, y, z);
    m.multiply(new THREE.Matrix4().makeRotationY(this.theta + yaw));
    if (tilt) m.multiply(new THREE.Matrix4().makeRotationX(tilt));
    return m;
  }
  // quad facing the shopper (for tags and signs)
  quad(B, u0, u1, y0, y1, t, uv) {
    B.quad(this.world(u0, y0, t), this.world(u1, y0, t), this.world(u1, y1, t), this.world(u0, y1, t), uv);
  }
}

// ---------------------------------------------------------------------------
// Planogram: vertical blocking by section, tallest products at the bottom,
// facings widened until the shelf is full.

function groupBySection(products, sectionIds) {
  return sectionIds.map((id) => ({ id, products: products.filter((p) => p.section === id) })).filter((g) => g.products.length);
}

function distribute(list, n) {
  const levels = Array.from({ length: n }, () => []);
  if (!list.length) return levels;
  if (list.length <= n) {
    // fewer products than shelves: give each a block of shelves
    let li = 0;
    list.forEach((p, i) => {
      const share = Math.round(((i + 1) * n) / list.length) - Math.round((i * n) / list.length);
      for (let k = 0; k < Math.max(1, share) && li < n; k++) levels[li++].push(p);
    });
    return levels;
  }
  const total = list.reduce((s, p) => s + p.dim[0], 0);
  let acc = 0, li = 0;
  list.forEach((p, i) => {
    const remainingProducts = list.length - i;
    const remainingLevels = n - li;
    if (li < n - 1 && levels[li].length && (acc >= (total * (li + 1)) / n || remainingProducts <= remainingLevels - 1)) li++;
    levels[li].push(p);
    acc += p.dim[0];
  });
  return levels;
}

export function stockShelf(ctx, side, levels, sectionIds, { maxDepth = 3, uStart = 0.03, uEnd = null, tFront = 0.02 } = {}) {
  const { ps, data, tags, tagAtlas } = ctx;
  const groups = groupBySection(data.products, sectionIds);
  const usable = (uEnd ?? side.length - 0.03) - uStart;
  const demand = groups.map((g) => g.products.reduce((s, p) => s + p.dim[0] * 2 + 0.02, 0));
  const totalDemand = demand.reduce((a, b) => a + b, 0);
  let u0 = uStart;
  const usableDepth = side.depth - tFront - 0.03;
  groups.forEach((g, gi) => {
    const span = (usable * demand[gi]) / totalDemand;
    const sorted = [...g.products].sort((a, b) => b.dim[1] - a.dim[1]);
    const perLevel = distribute(sorted, levels.length);
    perLevel.forEach((list, li) => {
      const lv = levels[li];
      if (!list.length) return;
      // keep a level's products in assortment order (by name) for a tidy look
      const items = [...list];
      const base = items.reduce((s, p) => s + p.dim[0] + 0.006, 0);
      const k = Math.max(1, Math.floor((span - 0.01) / base));
      const facings = items.map(() => k);
      let used = items.reduce((s, p, i) => s + (p.dim[0] + 0.006) * facings[i], 0);
      let grew = true;
      while (grew) {
        grew = false;
        for (let i = 0; i < items.length; i++) {
          const w = items[i].dim[0] + 0.006;
          if (used + w <= span - 0.01 && facings[i] < 40) {
            facings[i]++;
            used += w;
            grew = true;
          }
        }
      }
      let u = u0 + (span - used) / 2;
      items.forEach((p, i) => {
        const w = p.dim[0] + 0.006, d = p.dim[2];
        const fits = Math.max(1, Math.floor(usableDepth / (d + 0.004)));
        const depthCount = Math.min(fits, maxDepth);
        const slot = ps.slot(p, { fixture: 'shelf' });
        const sw = w * facings[i];
        for (let f = 0; f < facings[i]; f++) {
          for (let dk = 0; dk < depthCount; dk++) {
            const t = tFront + d / 2 + dk * (d + 0.004);
            ps.add(slot, p, side.matrix(u + w * (f + 0.5), lv.y, t), f, dk);
          }
        }
        ps.setSlotBox(slot, side.aabb(u, u + sw, lv.y, lv.y + Math.min(lv.clear, 0.45), tFront, side.depth - 0.03));
        // price tag on the shelf edge, at the left of the block
        if (tags && lv.tagY !== null) {
          const tw = Math.min(0.12, Math.max(0.09, sw - 0.01));
          side.quad(tags, u + 0.005, u + 0.005 + tw, lv.tagY, lv.tagY + tw / 2, -0.004, tagAtlas.rect(p));
        }
        u += sw;
      });
    });
    u0 += span;
  });
}

// ---------------------------------------------------------------------------

const GONDOLA_LEVELS = [
  { y: 0.12, clear: 0.39 },
  { y: 0.54, clear: 0.33 },
  { y: 0.9, clear: 0.31 },
  { y: 1.24, clear: 0.29 },
  { y: 1.56, clear: 0.4 },
];

// Double-sided shelf run along z, spine at x = cx.
export function gondola(ctx, cx, z0, z1, eastSections, westSections, { height = 1.98, depth = 0.5, levels: LV = GONDOLA_LEVELS } = {}) {
  const { fix, col, ps } = ctx;
  const L = z1 - z0;
  const east = new Side(cx, z1, Math.PI / 2, L, depth);
  const west = new Side(cx, z0, -Math.PI / 2, L, depth);
  // spine
  fix.color(COL.back);
  fix.boxMM(cx - 0.02, 0, z0, cx + 0.02, height, z1);
  ps.blocker([cx - 0.03, 0, z0, cx + 0.03, height, z1]);
  for (const s of [east, west]) {
    fix.color(COL.plinth);
    s.box(fix, 0, L, 0, 0.1, 0.02, depth);
    for (const lv of LV) {
      fix.color(COL.shelf);
      s.box(fix, 0, L, lv.y - 0.025, lv.y, 0.0, depth - 0.02);
      fix.color(COL.strip);
      s.box(fix, 0, L, lv.y - 0.065, lv.y - 0.015, -0.006, 0.0);
    }
    fix.color(COL.upright);
    for (let u = 0; u <= L + 0.01; u += L / Math.max(1, Math.round(L / 1.25))) s.box(fix, Math.max(0, u - 0.02), Math.min(L, u + 0.02), 0, height, depth - 0.05, depth);
  }
  // end caps
  fix.color(COL.upright);
  fix.boxMM(cx - depth, 0, z0 - 0.03, cx + depth, height, z0);
  fix.boxMM(cx - depth, 0, z1, cx + depth, height, z1 + 0.03);
  col.box(cx - depth, z0 - 0.03, cx + depth, z1 + 0.03, 'gondola');

  const levels = LV.map((l) => ({ ...l, tagY: l.y - 0.062 }));
  ps.begin('gondola-' + cx.toFixed(1) + '-e');
  stockShelf(ctx, east, levels, eastSections, { maxDepth: 2 });
  ps.end();
  ps.begin('gondola-' + cx.toFixed(1) + '-w');
  stockShelf(ctx, west, levels, westSections, { maxDepth: 2 });
  ps.end();
  return { east, west };
}

// Single-sided wall shelf (drinks wall etc.)
export function wallShelf(ctx, side, sections, { height = 1.98, levels = GONDOLA_LEVELS, maxDepth = 3, name = 'wall' } = {}) {
  const { fix, col, ps } = ctx;
  const L = side.length, D = side.depth;
  fix.color(COL.back);
  side.box(fix, 0, L, 0, height, D - 0.03, D);
  ps.blocker(side.aabb(0, L, 0, height, D - 0.04, D));
  fix.color(COL.plinth);
  side.box(fix, 0, L, 0, 0.1, 0.02, D);
  for (const lv of levels) {
    fix.color(COL.shelf);
    side.box(fix, 0, L, lv.y - 0.025, lv.y, 0, D - 0.03);
    fix.color(COL.strip);
    side.box(fix, 0, L, lv.y - 0.065, lv.y - 0.015, -0.006, 0);
  }
  fix.color(COL.upright);
  side.box(fix, 0, 0.03, 0, height, 0, D);
  side.box(fix, L - 0.03, L, 0, height, 0, D);
  const r = side.rect(0, L, 0, D);
  col.box(r[0], r[1], r[2], r[3], 'shelf');
  ps.begin(name);
  stockShelf(ctx, side, levels.map((l) => ({ ...l, tagY: l.y - 0.062 })), sections, { maxDepth });
  ps.end();
}

// Open multideck chiller along the back wall, facing +z.
const CHILL_LEVELS = [
  { y: 0.42, clear: 0.36 },
  { y: 0.84, clear: 0.3 },
  { y: 1.18, clear: 0.28 },
  { y: 1.5, clear: 0.28 },
];

export function chiller(ctx, x0, x1, zBack, sections, name = 'chiller') {
  const { fix, glow, col, ps } = ctx;
  const D = 0.85, H = 2.15;
  const side = new Side(x0, zBack, 0, x1 - x0, D);
  const L = x1 - x0;
  fix.color(COL.chillBody);
  side.box(fix, 0, L, 0, 0.36, 0.0, D); // base / deck front
  side.box(fix, 0, L, H - 0.28, H, 0.12, D); // canopy body
  fix.color(COL.chillIn);
  side.box(fix, 0, L, 0, H, D - 0.05, D); // back
  fix.color(COL.petrol);
  side.box(fix, 0, L, H - 0.3, H - 0.02, 0.1, 0.13); // canopy fascia
  fix.color(COL.chillBody);
  for (let u = 0; u <= L + 0.01; u += 2.5) side.box(fix, Math.max(0, u - 0.03), Math.min(L, u + 0.03), 0, H, 0.05, D); // dividers
  for (const lv of CHILL_LEVELS) {
    fix.color(COL.shelf);
    side.box(fix, 0, L, lv.y - 0.022, lv.y, 0.04, D - 0.05);
    fix.color(COL.strip);
    side.box(fix, 0, L, lv.y - 0.06, lv.y - 0.012, 0.034, 0.04);
  }
  glow.color('#f4fbff');
  side.box(glow, 0, L, H - 0.32, H - 0.3, 0.16, D - 0.08); // light strip
  ps.blocker(side.aabb(0, L, 0, H, D - 0.06, D));
  const r = side.rect(0, L, 0, D);
  col.box(r[0], r[1], r[2], r[3], 'chiller');
  ps.begin(name);
  stockShelf(ctx, side, CHILL_LEVELS.map((l) => ({ ...l, tagY: l.y - 0.058 })), sections, { maxDepth: 3, tFront: 0.05 });
  ps.end();
  return side;
}

// Island freezer chest along z, open top, products lying on the bed.
export function freezerChest(ctx, cx, z0, z1, eastSections, westSections) {
  const { fix, glow, col, ps, data, tags, tagAtlas } = ctx;
  const W = 1.8, H = 0.86, L = z1 - z0;
  fix.color(COL.freezer);
  fix.boxMM(cx - W / 2, 0, z0, cx + W / 2, 0.42, z1);
  fix.boxMM(cx - W / 2, 0.42, z0, cx - W / 2 + 0.06, H, z1);
  fix.boxMM(cx + W / 2 - 0.06, 0.42, z0, cx + W / 2, H, z1);
  fix.boxMM(cx - W / 2, 0.42, z0, cx + W / 2, H, z0 + 0.06);
  fix.boxMM(cx - W / 2, 0.42, z1 - 0.06, cx + W / 2, H, z1);
  fix.boxMM(cx - 0.03, 0.42, z0, cx + 0.03, H - 0.08, z1);
  fix.color(COL.petrol);
  fix.boxMM(cx - W / 2 - 0.01, H - 0.05, z0 - 0.01, cx + W / 2 + 0.01, H, z0 + 0.07);
  fix.boxMM(cx - W / 2 - 0.01, H - 0.05, z1 - 0.07, cx + W / 2 + 0.01, H, z1 + 0.01);
  fix.boxMM(cx - W / 2 - 0.01, H - 0.05, z0, cx - W / 2 + 0.07, H, z1);
  fix.boxMM(cx + W / 2 - 0.07, H - 0.05, z0, cx + W / 2 + 0.01, H, z1);
  glow.color('#dff1ff');
  glow.boxMM(cx - W / 2 + 0.06, 0.42, z0 + 0.06, cx + W / 2 - 0.06, 0.425, z1 - 0.06);
  col.box(cx - W / 2, z0, cx + W / 2, z1, 'freezer');
  const bedY = 0.43;
  const sides = [
    [new Side(cx, z1, Math.PI / 2, L, W / 2), eastSections, 'e'],
    [new Side(cx, z0, -Math.PI / 2, L, W / 2), westSections, 'w'],
  ];
  for (const [side, secs, n] of sides) {
    ps.begin('freezer-' + n);
    const groups = groupBySection(data.products, secs);
    const prods = groups.flatMap((g) => g.products);
    const usable = L - 0.16;
    const per = usable / prods.length;
    prods.forEach((p, i) => {
      const u0 = 0.08 + i * per;
      const [w, h, d] = p.dim;
      const nu = Math.max(1, Math.floor((per - 0.02) / (w + 0.01)));
      const nt = Math.max(1, Math.floor((W / 2 - 0.14) / (d + 0.01)));
      const layers = Math.max(1, Math.min(4, Math.floor(0.3 / h)));
      const slot = ps.slot(p, { fixture: 'freezer' });
      const used = nu * (w + 0.01);
      const ub = u0 + (per - used) / 2;
      for (let a = 0; a < nu; a++) {
        for (let b = 0; b < nt; b++) {
          for (let l = 0; l < layers; l++) {
            const col = a * 10 + b;
            ps.add(slot, p, side.matrix(ub + (w + 0.01) * (a + 0.5), bedY + l * (h + 0.002), 0.08 + (d + 0.01) * (b + 0.5)), col, -l);
          }
        }
      }
      ps.setSlotBox(slot, side.aabb(ub, ub + used, bedY, bedY + 0.35, 0.06, W / 2 - 0.04));
      side.quad(tags, ub + 0.01, ub + 0.11, H - 0.05, H - 0.0, -0.012, tagAtlas.rect(p));
    });
    ps.end();
  }
}

// Stepped crate display for fruit & veg. side faces the shopper.
export function produceStand(ctx, side, products, { tiers = 3, name = 'produce', tilt = 0.24 } = {}) {
  const { fix, ps, col, tags, tagAtlas } = ctx;
  const L = side.length, D = side.depth;
  const tierDepth = D / tiers;
  const tierY = (k) => 0.62 + k * 0.22;
  fix.color(COL.standBase);
  side.box(fix, 0, L, 0, tierY(0) - 0.02, 0.05, D);
  for (let k = 0; k < tiers; k++) {
    fix.color(COL.stand);
    side.box(fix, 0, L, tierY(k) - 0.02, tierY(k), k * tierDepth, D);
    if (k) side.box(fix, 0, L, tierY(k - 1), tierY(k), k * tierDepth, k * tierDepth + 0.02);
  }
  const r = side.rect(0, L, 0, D);
  col.box(r[0], r[1], r[2], r[3], 'produce');
  ps.begin(name);
  const crateW = 0.4, crateD = Math.min(0.32, tierDepth - 0.02), crateH = 0.13;
  const perTier = Math.floor(L / (crateW + 0.02));
  const cells = [];
  for (let k = 0; k < tiers; k++) for (let i = 0; i < perTier; i++) cells.push({ k, i });
  // each product gets a vertical stack of crates over the tiers (like a real stand)
  const cols = Math.max(1, Math.floor(perTier / Math.max(1, Math.ceil(products.length / tiers))));
  let ci = 0;
  products.forEach((p, n) => {
    const tier = n % tiers;
    const colStart = Math.floor(n / tiers) * cols;
    for (let c = 0; c < cols; c++) {
      const i = colStart + c;
      if (i >= perTier) break;
      const u = 0.02 + i * (crateW + 0.02) + crateW / 2;
      const y = tierY(tier);
      const t = tier * tierDepth + crateD / 2 + 0.01;
      const m = side.matrix(u, y, t, { tilt });
      if (p.loose || ['bunch', 'loose', 'head', 'piece'].includes(p.shape)) {
        const slot = ps.slot(p, { kind: 'bulk', stock: 40, fixture: 'produce' });
        const tpl = buildCrateDisplay(p, ctx.atlas, crateW, crateH, crateD);
        ps.add(slot, p, m, 0, 0, tpl);
        ps.setSlotBox(slot, side.aabb(u - crateW / 2, u + crateW / 2, y, y + 0.25, t - crateD / 2, t + crateD / 2));
      } else {
        // packed produce: units lying in an open crate
        const slot = ps.slot(p, { fixture: 'produce' });
        const crate = cratePlain(ctx, p, crateW, crateH, crateD);
        ps.add(slot, p, m, -1, 99, crate);
        const [w, h, d] = p.dim;
        const nu = Math.max(1, Math.floor((crateW - 0.03) / (w + 0.008)));
        const nt = Math.max(1, Math.floor((crateD - 0.03) / (d + 0.008)));
        const layers = h < 0.07 ? 2 : 1;
        for (let a = 0; a < nu; a++)
          for (let b = 0; b < nt; b++)
            for (let l = 0; l < layers; l++) {
              const lm = m.clone().multiply(new THREE.Matrix4().makeTranslation((a - (nu - 1) / 2) * (w + 0.008), 0.02 + l * (h + 0.003), (b - (nt - 1) / 2) * (d + 0.008)));
              ps.add(slot, p, lm, a, (nt - 1 - b) - l * 10);
            }
        ps.setSlotBox(slot, side.aabb(u - crateW / 2, u + crateW / 2, y, y + 0.3, t - crateD / 2, t + crateD / 2));
      }
      if (c === 0) side.quad(tags, u - 0.06, u + 0.06, y - 0.075, y - 0.015, tier * tierDepth - 0.005, tagAtlas.rect(p));
      ci++;
    }
  });
  ps.end();
}

function cratePlain(ctx, p, cw, ch, cd) {
  const key = 'crate:' + p.index;
  if (ctx.cache.has(key)) return ctx.cache.get(key);
  // reuse the crate display builder with no fruit by faking an empty pile
  const fake = { ...p, fruitShape: 'sphere', fruitSize: 0.0001 };
  const arr = buildCrateDisplay(fake, ctx.atlas, cw, ch, cd);
  ctx.cache.set(key, arr);
  return arr;
}

// Backstation: self-service bakery wall with compartments behind flaps.
export function bakery(ctx, x0, x1, zBack, products) {
  const { fix, glass, glow, col, ps, tags, tagAtlas } = ctx;
  const D = 0.7, H = 2.1;
  const side = new Side(x0, zBack, 0, x1 - x0, D);
  const L = x1 - x0;
  fix.color('#b98a5a');
  side.box(fix, 0, L, 0, H, D - 0.04, D);
  side.box(fix, 0, L, 0, 0.5, 0.05, D);
  fix.color('#7a4f2c');
  side.box(fix, 0, L, H - 0.25, H, 0, D);
  glow.color('#fff2d8');
  side.box(glow, 0, L, H - 0.27, H - 0.25, 0.1, D - 0.1);
  const rows = [0.55, 0.95, 1.35];
  const n = products.length;
  const cols = Math.ceil(n / rows.length);
  const cw = L / cols;
  fix.color('#d7b48a');
  for (const y of rows) side.box(fix, 0, L, y - 0.02, y, 0.03, D - 0.04);
  side.box(fix, 0, L, 1.73, 1.75, 0.03, D - 0.04);
  for (let c = 0; c <= cols; c++) side.box(fix, Math.max(0, c * cw - 0.015), Math.min(L, c * cw + 0.015), 0.5, 1.75, 0.03, D - 0.04);
  // tilted flaps (glass)
  for (const y of rows) {
    const a = side.world(0, y + 0.36, 0.0), b = side.world(L, y + 0.36, 0.0);
    const c2 = side.world(L, y + 0.2, -0.08), d2 = side.world(0, y + 0.2, -0.08);
    glass.quad(d2, c2, b, a, [0, 0]);
  }
  ps.blocker(side.aabb(0, L, 0, H, D - 0.05, D));
  const r = side.rect(0, L, 0, D);
  col.box(r[0], r[1] - 0.08, r[2], r[3], 'bakery');
  ps.begin('bakery');
  products.forEach((p, i) => {
    const ri = Math.floor(i / cols), ci = i % cols;
    const y = rows[rows.length - 1 - ri];
    const u0 = ci * cw;
    const slot = ps.slot(p, { fixture: 'bakery' });
    const [w, h, d] = p.dim;
    const nu = Math.max(1, Math.floor((cw - 0.06) / (w + 0.01)));
    const nt = Math.max(1, Math.min(3, Math.floor((D - 0.16) / (d + 0.01))));
    const layers = 1;
    const R = rng(p.index);
    for (let a = 0; a < nu; a++)
      for (let b = 0; b < nt; b++)
        for (let l = 0; l < layers; l++) {
          const m = side.matrix(u0 + 0.03 + (w + 0.01) * (a + 0.5), y + l * h * 0.8, 0.08 + (d + 0.01) * (b + 0.5), { yaw: (R() - 0.5) * 0.5 });
          ps.add(slot, p, m, a, b - l * 10);
        }
    ps.setSlotBox(slot, side.aabb(u0, u0 + cw, y, y + 0.36, 0.0, D - 0.06));
    side.quad(tags, u0 + cw / 2 - 0.06, u0 + cw / 2 + 0.06, y + 0.37, y + 0.43, -0.006, tagAtlas.rect(p));
  });
  ps.end();
}

// Pallets with stacked packs (water, beer crates), facing the aisle.
export function palletRow(ctx, side, products, { name = 'pallets', layersMax = 5 } = {}) {
  const { fix, ps, col, tags, tagAtlas } = ctx;
  const PW = 1.2, PD = 0.8;
  ps.begin(name);
  products.forEach((p, i) => {
    const u0 = i * (PW + 0.15) + 0.05;
    fix.color(COL.pallet);
    side.box(fix, u0, u0 + PW, 0, 0.14, 0.0, PD);
    fix.color('#8a6a45');
    for (const k of [0, 0.5, 1]) side.box(fix, u0 + k * (PW - 0.1), u0 + k * (PW - 0.1) + 0.1, 0, 0.12, 0.0, PD);
    const r = side.rect(u0, u0 + PW, 0, PD);
    col.box(r[0], r[1], r[2], r[3], 'pallet');
    const [w, h, d] = p.dim;
    const nu = Math.floor(PW / (w + 0.005)), nt = Math.floor(PD / (d + 0.005));
    const layers = Math.min(layersMax, Math.floor(1.45 / (h + 0.003)));
    const slot = ps.slot(p, { fixture: 'pallet' });
    for (let l = 0; l < layers; l++)
      for (let a = 0; a < nu; a++)
        for (let b = 0; b < nt; b++) {
          if (l === layers - 1 && (a + b) % 3 === 0) continue; // a used top layer
          ps.add(slot, p, side.matrix(u0 + (PW - nu * (w + 0.005)) / 2 + (w + 0.005) * (a + 0.5), 0.14 + l * (h + 0.003), (d + 0.005) * (b + 0.5)), a * 10 + b, -l * 10 + b);
        }
    ps.setSlotBox(slot, side.aabb(u0, u0 + PW, 0.14, 0.14 + layers * h + 0.1, 0, PD));
    // sign on a pole
    fix.color(COL.upright);
    side.box(fix, u0 + PW / 2 - 0.015, u0 + PW / 2 + 0.015, 0, 1.75, PD - 0.03, PD);
    side.quad(tags, u0 + PW / 2 - 0.16, u0 + PW / 2 + 0.16, 1.75, 1.91, PD - 0.04, tagAtlas.rect(p));
  });
  ps.end();
}

// Aktion bins in the middle aisle: products lying in a low open bin.
export function bin(ctx, cx, cz, products, name) {
  const { fix, ps, col, tags, tagAtlas } = ctx;
  const W = 1.6, D = 1.0, H = 0.75;
  fix.color(COL.bin);
  fix.boxMM(cx - W / 2, 0, cz - D / 2, cx + W / 2, 0.35, cz + D / 2);
  fix.color('#e9ecef');
  fix.boxMM(cx - W / 2, 0.35, cz - D / 2, cx - W / 2 + 0.03, H, cz + D / 2);
  fix.boxMM(cx + W / 2 - 0.03, 0.35, cz - D / 2, cx + W / 2, H, cz + D / 2);
  fix.boxMM(cx - W / 2, 0.35, cz - D / 2, cx + W / 2, H, cz - D / 2 + 0.03);
  fix.boxMM(cx - W / 2, 0.35, cz + D / 2 - 0.03, cx + W / 2, H, cz + D / 2);
  fix.color(COL.amber);
  fix.boxMM(cx - W / 2 - 0.005, H - 0.06, cz - D / 2 - 0.005, cx + W / 2 + 0.005, H, cz - D / 2 + 0.03);
  fix.boxMM(cx - W / 2 - 0.005, H - 0.06, cz + D / 2 - 0.03, cx + W / 2 + 0.005, H, cz + D / 2 + 0.005);
  fix.boxMM(cx - W / 2 - 0.005, H - 0.06, cz - D / 2, cx - W / 2 + 0.03, H, cz + D / 2);
  fix.boxMM(cx + W / 2 - 0.03, H - 0.06, cz - D / 2, cx + W / 2 + 0.005, H, cz + D / 2);
  col.box(cx - W / 2, cz - D / 2, cx + W / 2, cz + D / 2, 'bin');
  ps.begin(name);
  const half = W / products.length;
  products.forEach((p, i) => {
    const x0 = cx - W / 2 + i * half;
    const slot = ps.slot(p, { fixture: 'bin' });
    const [w, h, d] = p.dim;
    // lay big boxes flat
    const flat = h > w;
    const fw = flat ? w : w, fd = flat ? h : d, fh = flat ? d : h;
    const nu = Math.max(1, Math.floor((half - 0.06) / (fw + 0.01)));
    const nt = Math.max(1, Math.floor((D - 0.08) / (fd + 0.01)));
    const layers = Math.max(1, Math.min(3, Math.floor(0.38 / fh)));
    for (let l = 0; l < layers; l++)
      for (let a = 0; a < nu; a++)
        for (let b = 0; b < nt; b++) {
          const m = new THREE.Matrix4().makeTranslation(x0 + 0.03 + (fw + 0.01) * (a + 0.5), 0.36 + l * (fh + 0.004) + (flat ? fh / 2 : 0), cz - D / 2 + 0.04 + (fd + 0.01) * (b + 0.5) - (flat ? 0 : 0));
          if (flat) m.multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).multiply(new THREE.Matrix4().makeTranslation(0, -h / 2, 0));
          ps.add(slot, p, m, a * 10 + b, -l);
        }
    ps.setSlotBox(slot, [x0, 0.35, cz - D / 2, x0 + half, 0.85, cz + D / 2]);
    const s = new Side(x0, cz - D / 2, 0, half, D);
    s.quad(tags, half / 2 - 0.07, half / 2 + 0.07, H - 0.055, H + 0.015, -0.008, tagAtlas.rect(p));
  });
  ps.end();
}

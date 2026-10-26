// The shopping cart: a model, a list of items and a little packer that drops
// each item into the lowest free spot of the basket (big packs go underneath).
import * as THREE from '../../vendor/three.module.min.js';
import { makeCart, CART } from '../world/models.js';
import { rng } from '../util.js';

const CELL = 0.035;

export class HeightMap {
  constructor(x0, x1, z0, z1, floor, maxH) {
    this.x0 = x0; this.z0 = z0; this.floor = floor; this.maxH = maxH;
    this.nx = Math.floor((x1 - x0) / CELL);
    this.nz = Math.floor((z1 - z0) / CELL);
    this.h = new Float32Array(this.nx * this.nz);
  }
  reset() { this.h.fill(0); }
  // best spot for a footprint of fx × fz metres and height hh; null if it doesn't fit
  find(fx, fz, hh) {
    const cx = Math.ceil(fx / CELL - 0.15), cz = Math.ceil(fz / CELL - 0.15);
    if (cx > this.nx || cz > this.nz) return null;
    let best = null;
    for (let k = 0; k + cz <= this.nz; k++) {
      for (let i = 0; i + cx <= this.nx; i++) {
        let base = 0;
        for (let kk = k; kk < k + cz; kk++) for (let ii = i; ii < i + cx; ii++) base = Math.max(base, this.h[kk * this.nx + ii]);
        const top = base + hh;
        if (top > this.maxH) continue;
        const score = top + k * 0.0015 + Math.abs(i + cx / 2 - this.nx / 2) * 0.0004;
        if (!best || score < best.score) best = { i, k, cx, cz, base, top, score };
      }
    }
    return best;
  }
  mark(s) {
    for (let kk = s.k; kk < s.k + s.cz; kk++) for (let ii = s.i; ii < s.i + s.cx; ii++) this.h[kk * this.nx + ii] = s.top;
  }
  centre(s) {
    return [this.x0 + (s.i + s.cx / 2) * CELL, this.z0 + (s.k + s.cz / 2) * CELL];
  }
}

const ORIENT = [
  // [footprint x, footprint z, height, rotation builder]
  (w, h, d) => [w, d, h, (m) => m],
  (w, h, d) => [d, w, h, (m) => m.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2))],
  (w, h, d) => [w, h, d, (m) => m.multiply(new THREE.Matrix4().makeTranslation(0, d / 2, h / 2)).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2))],
  (w, h, d) => [h, w, d, (m) => m.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)).multiply(new THREE.Matrix4().makeTranslation(0, d / 2, h / 2)).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2))],
];

export function isBulky(p) {
  const [w, h, d] = p.dim;
  return p.shape === 'pack' || p.shape === 'crate' || w * h * d > 0.009;
}

// Packs items into one or more height maps; used by the cart and the car boot.
export class Packer {
  constructor(areas) {
    this.areas = areas; // [{map, accept(p)}]
  }
  reset() {
    for (const a of this.areas) a.map.reset();
  }
  place(item, seed) {
    const p = item.p;
    const [w, h, d] = p.dim;
    const R = rng(seed);
    const lieFirst = h > 0.2 && p.shape !== 'pack' && p.shape !== 'crate';
    const order = lieFirst ? [2, 3, 0, 1] : [0, 1, 2, 3];
    for (const area of this.areas) {
      if (area.accept && !area.accept(p)) continue;
      let best = null;
      for (const oi of order) {
        const [fx, fz, hh, rot] = ORIENT[oi](w, h, d);
        const s = area.map.find(fx + 0.004, fz + 0.004, hh);
        if (!s) continue;
        const preferBonus = order.indexOf(oi) < 2 ? 0 : 0.03;
        const score = s.score + preferBonus;
        if (!best || score < best.score) best = { ...s, score, rot, hh };
      }
      if (!best) continue;
      area.map.mark(best);
      const [x, z] = area.map.centre(best);
      const m = new THREE.Matrix4().makeTranslation(x, area.map.floor + best.base, z);
      m.multiply(new THREE.Matrix4().makeRotationY((R() - 0.5) * 0.12));
      best.rot(m);
      return m;
    }
    return null;
  }
}

export class Cart {
  constructor(scene) {
    this.group = makeCart();
    this.contents = this.group.userData.contents;
    scene.add(this.group);
    this.items = [];
    this.x = 0; this.z = 0; this.yaw = 0;
    const b = CART.basket, t = CART.tray;
    this.basket = new HeightMap(b.x0, b.x1, b.z0, b.z1, b.y, b.top - b.y + 0.2);
    this.tray = new HeightMap(t.x0, t.x1, t.z0, t.z1, t.y, t.top - t.y);
    this.packer = new Packer([
      { map: this.tray, accept: isBulky },
      { map: this.basket },
    ]);
    this.colliders = null;
  }

  setPose(x, z, yaw) {
    this.x = x; this.z = z; this.yaw = yaw;
    this.group.position.set(x, 0, z);
    this.group.rotation.y = yaw;
  }

  // circles along the cart for collision, in world space
  circles(x = this.x, z = this.z, yaw = this.yaw) {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    return [-0.27, 0, 0.25].map((o) => ({ x: x + fx * o, z: z + fz * o, r: 0.27 }));
  }

  // When nobody holds the cart it becomes an obstacle.
  park(col) {
    this.unpark(col);
    this.colliders = this.circles().map((c) => col.circle(c.x, c.z, c.r, 'cart'));
  }
  unpark(col) {
    if (this.colliders) for (const c of this.colliders) col.remove(c);
    this.colliders = null;
  }

  handle() {
    return { x: this.x + Math.sin(this.yaw) * 0.52, z: this.z + Math.cos(this.yaw) * 0.52 };
  }

  add(item) {
    const m = this.packer.place(item, this.items.length * 17 + item.p.index);
    if (!m) return false;
    this.items.push(item);
    item.mesh.matrixAutoUpdate = false;
    item.mesh.matrix.copy(m);
    this.contents.add(item.mesh);
    return true;
  }

  remove(item) {
    const i = this.items.indexOf(item);
    if (i < 0) return false;
    this.items.splice(i, 1);
    this.contents.remove(item.mesh);
    this.relayout();
    return true;
  }

  relayout() {
    this.packer.reset();
    const items = this.items;
    this.items = [];
    for (const it of items) {
      this.contents.remove(it.mesh);
      if (!this.add(it)) {
        // should not happen (it fitted before); keep it anyway
        this.items.push(it);
        this.contents.add(it.mesh);
      }
    }
  }

  // world position of an item mesh (for fly-out animations)
  worldOf(item, v = new THREE.Vector3()) {
    this.group.updateMatrixWorld();
    return v.setFromMatrixPosition(item.mesh.matrix).applyMatrix4(this.group.matrixWorld);
  }
}

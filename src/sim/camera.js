// Orbit camera for watching the simulation: drag to turn, right-drag or
// Shift-drag to pan, wheel or pinch to zoom, WASD to move, presets, and
// "follow someone".
import * as THREE from '../../vendor/three.module.min.js';
import { STORE } from '../world/layout.js';

export const PRESETS = {
  overview: { target: [8, 0, 14], dist: 78, yaw: 0.42, pitch: 0.55, cut: false },
  top: { target: [9.5, 0, 0], dist: 44, yaw: 0.0, pitch: 1.36, cut: true },
  tills: { target: [-5.0, 0.8, 7.6], dist: 14, yaw: 2.55, pitch: 0.72, cut: true },
  dock: { target: [26, 1, -7], dist: 30, yaw: 1.05, pitch: 0.48, cut: true },
  lot: { target: [2, 0, 27], dist: 42, yaw: 0.6, pitch: 0.62, cut: false },
  shelves: { target: [5.2, 0.8, -4], dist: 14, yaw: 0.5, pitch: 0.75, cut: true },
};

export class SimCamera {
  constructor(dom, camera) {
    this.cam = camera;
    this.target = new THREE.Vector3(8, 0, 14);
    this.dist = 78;
    this.yaw = 0.42;
    this.pitch = 0.55;
    this.goal = null;
    this.follow = null;
    this.cut = false;
    this.keys = new Set();
    let drag = null;
    const pts = new Map();
    dom.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      drag = { pan: e.button === 2 || e.shiftKey };
      dom.setPointerCapture?.(e.pointerId);
    });
    dom.addEventListener('pointermove', (e) => {
      if (!this.active || !pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId);
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (pts.size === 2) {
        // pinch: zoom by the change in finger distance
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinch) this.dist = clamp(this.dist * (this.pinch / d), 4, 160);
        this.pinch = d;
        return;
      }
      this.goal = null;
      if (drag && drag.pan) this.pan(-dx, -dy);
      else {
        this.yaw -= dx * 0.005;
        this.pitch = clamp(this.pitch + dy * 0.004, 0.08, 1.48);
      }
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) this.pinch = 0;
      if (!pts.size) drag = null;
    };
    dom.addEventListener('pointerup', up);
    dom.addEventListener('pointercancel', up);
    dom.addEventListener('contextmenu', (e) => this.active && e.preventDefault());
    dom.addEventListener(
      'wheel',
      (e) => {
        if (!this.active) return;
        e.preventDefault();
        this.goal = null;
        this.dist = clamp(this.dist * Math.pow(1.0015, e.deltaY), 4, 160);
      },
      { passive: false }
    );
    addEventListener('keydown', (e) => this.active && this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  pan(dx, dy) {
    const s = this.dist * 0.0016;
    const c = Math.cos(this.yaw), n = Math.sin(this.yaw);
    this.follow = null;
    this.target.x += (dx * c + dy * n) * s;
    this.target.z += (-dx * n + dy * c) * s;
  }

  preset(name) {
    const p = PRESETS[name];
    this.follow = null;
    this.goal = { target: new THREE.Vector3(...p.target), dist: p.dist, yaw: p.yaw, pitch: p.pitch };
    this.cut = p.cut;
  }

  // finish the current camera move at once (for cuts)
  snap() {
    const g = this.goal;
    if (!g) return;
    if (g.target) this.target.copy(g.target);
    this.dist = g.dist;
    if (g.yaw !== undefined) this.yaw = g.yaw;
    this.pitch = g.pitch;
    this.goal = null;
  }

  followAgent(a) {
    this.follow = a;
    this.cut = !!a.inside || (a.onDuty && a.x > STORE.x0 && a.x < STORE.x1 + 6.5 && a.z < STORE.z1);
    this.goal = { dist: 11, pitch: this.cut ? 1.1 : 0.6 };
  }

  update(dt) {
    const k = 1 - Math.exp(-dt * 3);
    if (this.goal) {
      const g = this.goal;
      if (g.target) this.target.lerp(g.target, k);
      this.dist += (g.dist - this.dist) * k;
      if (g.yaw !== undefined) this.yaw += wrap(g.yaw - this.yaw) * k;
      this.pitch += (g.pitch - this.pitch) * k;
      const near = Math.abs(g.dist - this.dist) < 0.05 && Math.abs(g.pitch - this.pitch) < 0.005 && (g.yaw === undefined || Math.abs(wrap(g.yaw - this.yaw)) < 0.005);
      if (near && (!g.target || this.target.distanceTo(g.target) < 0.05)) this.goal = null;
    }
    if (this.follow) {
      const f = this.follow;
      const fx = f.car && !f.mesh.visible ? f.car.x : f.x;
      const fz = f.car && !f.mesh.visible ? f.car.z : f.z;
      this.target.lerp(new THREE.Vector3(fx, 0.9, fz), 1 - Math.exp(-dt * 4));
      // inside the shop: roof off and a steeper angle, so the walls don't get in the way
      const cut = fx > STORE.x0 - 1 && fx < STORE.x1 + 6.5 && fz > STORE.z0 - 1 && fz < STORE.z1;
      if (cut !== this.cut) {
        this.goal = { dist: this.dist, pitch: cut ? 1.1 : 0.6 };
        this.cut = cut;
      }
    }
    const s = this.dist * dt * 0.9;
    const kx = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    const kz = (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0);
    if (kx || kz) {
      this.goal = null;
      this.pan((kx * s) / (this.dist * 0.0016), (kz * s) / (this.dist * 0.0016));
    }
    if (this.keys.has('KeyQ')) this.yaw += dt;
    if (this.keys.has('KeyE')) this.yaw -= dt;
    const cp = Math.cos(this.pitch);
    this.cam.position.set(
      this.target.x + Math.sin(this.yaw) * cp * this.dist,
      this.target.y + Math.sin(this.pitch) * this.dist,
      this.target.z + Math.cos(this.yaw) * cp * this.dist
    );
    this.cam.lookAt(this.target);
  }

  // hide the roof when looking into the shop from above
  roofHidden() {
    return this.cut && this.cam.position.y > 3.2;
  }
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

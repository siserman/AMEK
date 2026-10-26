// A tiny geometry builder: quads, boxes, lathes and ellipsoids written straight
// into flat arrays, so whole fixture rows end up as one draw call.
import * as THREE from '../../vendor/three.module.min.js';
import { hexToRgb } from '../util.js';

const colorCache = new Map();
export function rgb(hex) {
  let c = colorCache.get(hex);
  if (!c) {
    // vertex colours are linear; the hex values are sRGB
    const col = new THREE.Color(hex);
    c = [col.r, col.g, col.b];
    colorCache.set(hex, c);
  }
  return c;
}
export { hexToRgb };

export class GeoBuilder {
  constructor({ uv = true, color = false } = {}) {
    this.hasUV = uv;
    this.hasColor = color;
    this.pos = [];
    this.nor = [];
    this.uv = [];
    this.col = [];
    this.idx = [];
    this.c = [1, 1, 1];
    this.m = null;
  }

  get count() {
    return this.pos.length / 3;
  }

  color(hex) {
    this.c = typeof hex === 'string' ? rgb(hex) : hex;
    return this;
  }

  v(x, y, z, nx, ny, nz, u = 0, w = 0) {
    if (this.m) {
      const e = this.m.elements;
      const X = e[0] * x + e[4] * y + e[8] * z + e[12];
      const Y = e[1] * x + e[5] * y + e[9] * z + e[13];
      const Z = e[2] * x + e[6] * y + e[10] * z + e[14];
      const NX = e[0] * nx + e[4] * ny + e[8] * nz;
      const NY = e[1] * nx + e[5] * ny + e[9] * nz;
      const NZ = e[2] * nx + e[6] * ny + e[10] * nz;
      const l = Math.hypot(NX, NY, NZ) || 1;
      x = X; y = Y; z = Z; nx = NX / l; ny = NY / l; nz = NZ / l;
    }
    this.pos.push(x, y, z);
    this.nor.push(nx, ny, nz);
    if (this.hasUV) this.uv.push(u, w);
    if (this.hasColor) this.col.push(this.c[0], this.c[1], this.c[2]);
    return this.count - 1;
  }

  // a,b,c,d counter-clockwise seen from outside (bottom-left, bottom-right, top-right, top-left).
  // uv: rect {u0,v0,u1,v1} or a single [u, v] patch.
  quad(a, b, c, d, uv) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    const t = quadUV(uv);
    const i = this.v(a[0], a[1], a[2], nx, ny, nz, t[0], t[1]);
    this.v(b[0], b[1], b[2], nx, ny, nz, t[2], t[3]);
    this.v(c[0], c[1], c[2], nx, ny, nz, t[4], t[5]);
    this.v(d[0], d[1], d[2], nx, ny, nz, t[6], t[7]);
    this.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }

  tri(a, b, c, uv) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    const t = Array.isArray(uv) ? uv : [0, 0];
    const i = this.v(a[0], a[1], a[2], nx / l, ny / l, nz / l, t[0], t[1]);
    this.v(b[0], b[1], b[2], nx / l, ny / l, nz / l, t[0], t[1]);
    this.v(c[0], c[1], c[2], nx / l, ny / l, nz / l, t[0], t[1]);
    this.idx.push(i, i + 1, i + 2);
  }

  // Axis-aligned box standing on y0, centred on cx/cz. opts.uv: per-face uv
  // ({front, back, left, right, top, bottom, other}); opts.skip: faces to leave out.
  box(cx, y0, cz, w, h, d, opts = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
    const uv = opts.uv || {};
    const skip = opts.skip || {};
    const f = (k) => uv[k] ?? uv.other ?? [0, 0];
    if (!skip.front) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], f('front'));
    if (!skip.back) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], f('back'));
    if (!skip.right) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], f('right'));
    if (!skip.left) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], f('left'));
    if (!skip.top) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], f('top'));
    if (!skip.bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], f('bottom'));
  }

  // Box given by min/max corners (handy for architecture).
  boxMM(x0, y0, z0, x1, y1, z1, opts) {
    this.box((x0 + x1) / 2, Math.min(y0, y1), (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), opts);
  }

  // Surface of revolution around the y axis. profile: [[r, y], ...] bottom to top.
  // uvFn(theta, y) -> [u, v]. theta = 0 faces +z (the product front).
  lathe(profile, segs, uvFn, { cx = 0, cy = 0, cz = 0, t0 = -Math.PI, t1 = Math.PI } = {}) {
    const n = profile.length;
    const norms = profile.map((p, j) => {
      const a = profile[Math.max(0, j - 1)], b = profile[Math.min(n - 1, j + 1)];
      let tr = b[0] - a[0], ty = b[1] - a[1];
      const l = Math.hypot(tr, ty) || 1;
      return [ty / l, -tr / l];
    });
    const base = this.count;
    for (let i = 0; i <= segs; i++) {
      const th = t0 + ((t1 - t0) * i) / segs;
      const s = Math.sin(th), c = Math.cos(th);
      for (let j = 0; j < n; j++) {
        const [r, y] = profile[j];
        const [nr, ny] = norms[j];
        const t = uvFn ? uvFn(th, y, j) : [0, 0];
        this.v(cx + r * s, cy + y, cz + r * c, nr * s, ny, nr * c, t[0], t[1]);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < n - 1; j++) {
        const a = base + i * n + j, b = base + (i + 1) * n + j;
        this.idx.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
  }

  // Vertical cylinder with caps; label covers the front half of the side.
  cylinder(cx, y0, cz, r, h, segs, { side, top, bottom, rTop = r } = {}) {
    const s = side || [0, 0];
    const patch = typeof s === 'function' ? [0, 0] : s;
    this.lathe([[0, 0], [r, 0]], segs, () => bottom || patch, { cx, cy: y0, cz });
    this.lathe([[r, 0], [rTop, h]], segs, typeof s === 'function' ? s : () => s, { cx, cy: y0, cz });
    this.lathe([[rTop, h], [0, h]], segs, () => top || patch, { cx, cy: y0, cz });
  }

  ellipsoid(cx, cy, cz, rx, ry, rz, uv = [0, 0], segW = 8, segH = 6) {
    const base = this.count;
    for (let i = 0; i <= segH; i++) {
      const ph = (Math.PI * i) / segH;
      const sp = Math.sin(ph), cp = Math.cos(ph);
      for (let j = 0; j <= segW; j++) {
        const th = (2 * Math.PI * j) / segW;
        const x = sp * Math.sin(th), y = -cp, z = sp * Math.cos(th);
        let nx = x / rx, ny = y / ry, nz = z / rz;
        const l = Math.hypot(nx, ny, nz) || 1;
        this.v(cx + x * rx, cy + y * ry, cz + z * rz, nx / l, ny / l, nz / l, uv[0], uv[1]);
      }
    }
    for (let i = 0; i < segH; i++) {
      for (let j = 0; j < segW; j++) {
        const a = base + i * (segW + 1) + j, b = a + segW + 1;
        this.idx.push(a, a + 1, b + 1, a, b + 1, b);
      }
    }
  }

  torus(cx, cy, cz, R, r, uv = [0, 0], segR = 14, segT = 6, flatY = 0.6) {
    const base = this.count;
    for (let i = 0; i <= segR; i++) {
      const u = (i / segR) * Math.PI * 2;
      for (let j = 0; j <= segT; j++) {
        const v = (j / segT) * Math.PI * 2;
        const nx = Math.cos(v) * Math.cos(u), ny = Math.sin(v), nz = Math.cos(v) * Math.sin(u);
        const x = (R + r * Math.cos(v)) * Math.cos(u);
        const z = (R + r * Math.cos(v)) * Math.sin(u);
        const y = r * Math.sin(v) * flatY;
        const l = Math.hypot(nx, ny / flatY, nz) || 1;
        this.v(cx + x, cy + y, cz + z, nx / l, ny / flatY / l, nz / l, uv[0], uv[1]);
      }
    }
    for (let i = 0; i < segR; i++) {
      for (let j = 0; j < segT; j++) {
        const a = base + i * (segT + 1) + j, b = a + segT + 1;
        this.idx.push(a, b + 1, b, a, a + 1, b + 1);
      }
    }
  }

  // Ground-level flat rectangle (for road markings etc.)
  flat(cx, y, cz, w, d, uv) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    this.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], uv || [0, 0]);
  }

  transform(m) {
    this.m = m;
    return this;
  }

  toArrays() {
    const pos = new Float32Array(this.pos);
    const bbox = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        if (pos[i + k] < bbox[k]) bbox[k] = pos[i + k];
        if (pos[i + k] > bbox[k + 3]) bbox[k + 3] = pos[i + k];
      }
    }
    return {
      pos,
      nor: new Float32Array(this.nor),
      uv: this.hasUV ? new Float32Array(this.uv) : null,
      col: this.hasColor ? new Float32Array(this.col) : null,
      idx: new Uint32Array(this.idx),
      bbox,
    };
  }

  build() {
    return arraysToGeometry(this.toArrays());
  }
}

export function arraysToGeometry(a) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(a.nor, 3));
  if (a.uv) g.setAttribute('uv', new THREE.BufferAttribute(a.uv, 2));
  if (a.col) g.setAttribute('color', new THREE.BufferAttribute(a.col, 3));
  g.setIndex(new THREE.BufferAttribute(a.idx, 1));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}

function quadUV(uv) {
  if (!uv) return [0, 0, 0, 0, 0, 0, 0, 0];
  if (Array.isArray(uv)) return [uv[0], uv[1], uv[0], uv[1], uv[0], uv[1], uv[0], uv[1]];
  if (uv.flipX) return [uv.u1, uv.v0, uv.u0, uv.v0, uv.u0, uv.v1, uv.u1, uv.v1];
  return [uv.u0, uv.v0, uv.u1, uv.v0, uv.u1, uv.v1, uv.u0, uv.v1];
}

// Material helpers
export function vcMat(opts = {}) {
  return new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0, ...opts });
}

// Base for everything that moves on its own: a queue of steps (walk a path,
// wait, wait until, do something) that is worked off with whatever simulated
// time a frame provides, so it behaves the same at 1× and at 1800×.
// Steps added while a then() callback runs are inserted right after it, so a
// plan made "on the spot" happens next, before anything queued earlier.

export class Agent {
  constructor(sim) {
    this.sim = sim;
    this.steps = [];
    this.cur = null;
    this.x = 0;
    this.z = 0;
    this.yaw = 0;
    this.moving = false;
    this.done = false;
    this.activity = '';
    this._ins = null;
  }

  _add(step) {
    if (this._ins !== null) this.steps.splice(this._ins++, 0, step);
    else this.steps.push(step);
    return this;
  }
  walk(pts, speed = 1.3, opts = {}) {
    if (!pts || pts.length < 2) return this;
    return this._add(new Walk(pts, speed, opts));
  }
  wait(t, label) {
    return this._add({ t, label, init(a) { if (label) a.activity = label; }, tick(a, dt) { this.t -= dt; a.moving = false; return this.t <= 0 ? -this.t : -1; } });
  }
  until(fn, label) {
    return this._add({ init(a) { if (label) a.activity = label; }, tick(a, dt) { a.moving = false; return fn() ? dt : -1; } });
  }
  then(fn) {
    return this._add({
      tick(a, dt) {
        const prev = a._ins;
        a._ins = 0;
        fn();
        a._ins = prev;
        return dt;
      },
    });
  }
  face(yaw) {
    return this.then(() => (this.yaw = yaw));
  }

  update(dt) {
    let t = dt;
    for (let guard = 0; t > 1e-6 && guard < 60; guard++) {
      if (!this.cur) {
        this.cur = this.steps.shift();
        if (!this.cur) {
          this.moving = false;
          return;
        }
        if (this.cur.init) this.cur.init(this);
      }
      const left = this.cur.tick(this, t);
      if (left < 0) return;
      this.cur = null;
      t = left;
    }
  }

  get idle() {
    return !this.cur && !this.steps.length;
  }
}

// Follow a polyline at a given speed; reverse = drive backwards (cars).
export class Walk {
  constructor(pts, speed, { reverse = false, label = null, side = 0 } = {}) {
    this.pts = side ? offsetPath(pts, side) : pts;
    this.speed = speed;
    this.reverse = reverse;
    this.label = label;
    this.i = 0;
    this.s = 0;
  }
  init(a) {
    if (this.label) a.activity = this.label;
  }
  tick(a, dt) {
    let rem = dt * this.speed;
    const P = this.pts;
    while (rem > 0 && this.i < P.length - 1) {
      const A = P[this.i], B = P[this.i + 1];
      const dx = B.x - A.x, dz = B.z - A.z;
      const L = Math.hypot(dx, dz);
      if (L > 1e-4) a.yaw = Math.atan2(-dx, -dz) + (this.reverse ? Math.PI : 0);
      const left = L - this.s;
      if (rem >= left) {
        rem -= left;
        this.i++;
        this.s = 0;
      } else {
        this.s += rem;
        rem = 0;
      }
    }
    if (this.i >= P.length - 1) {
      const E = P[P.length - 1];
      a.x = E.x;
      a.z = E.z;
      a.moving = false;
      return rem / this.speed;
    }
    const A = P[this.i], B = P[this.i + 1];
    const L = Math.hypot(B.x - A.x, B.z - A.z) || 1;
    a.x = A.x + ((B.x - A.x) * this.s) / L;
    a.z = A.z + ((B.z - A.z) * this.s) / L;
    a.moving = true;
    return -1;
  }
}

// Shift the inner points of a path sideways so people don't all walk the
// exact centre line. The first and last point stay put.
export function offsetPath(pts, side) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], p = pts[i], b = pts[i + 1];
    const n1 = norm(-(p.z - a.z), p.x - a.x), n2 = norm(-(b.z - p.z), b.x - p.x);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1];
    const ml = Math.hypot(mx, mz) || 1;
    mx /= ml;
    mz /= ml;
    const k = side / Math.max(0.5, mx * n1[0] + mz * n1[1]);
    out.push({ x: p.x + mx * k, z: p.z + mz * k });
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function norm(x, z) {
  const l = Math.hypot(x, z) || 1;
  return [x / l, z / l];
}

// Quadratic Bézier from a to c via control b, sampled into points (for driving).
export function curve(a, b, c, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push({ x: u * u * a.x + 2 * u * t * b.x + t * t * c.x, z: u * u * a.z + 2 * u * t * b.z + t * t * c.z });
  }
  return out;
}

export function cubic(a, b, c, d, n = 10) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push({
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      z: u * u * u * a.z + 3 * u * u * t * b.z + 3 * u * t * t * c.z + t * t * t * d.z,
    });
  }
  return out;
}

export const P = (x, z) => ({ x, z });
export const join = (...parts) => {
  const out = [];
  for (const part of parts) for (const p of part) {
    const l = out[out.length - 1];
    if (!l || Math.hypot(l.x - p.x, l.z - p.z) > 0.02) out.push(p);
  }
  return out;
};

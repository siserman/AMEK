// 2D collision on the ground plane (x/z). The world is axis-aligned boxes plus
// circles; moving bodies (you, the cart, the car) are a set of circles that get
// pushed out of everything they overlap, which gives sliding along walls for free.

// ignore: a Set of colliders or a predicate
const skip = (ignore, c) => (typeof ignore === 'function' ? ignore(c) : ignore.has(c));

export class CollisionWorld {
  constructor() {
    this.boxes = [];
    this.circles = [];
  }

  box(minX, minZ, maxX, maxZ, tag = '') {
    const b = { minX: Math.min(minX, maxX), maxX: Math.max(minX, maxX), minZ: Math.min(minZ, maxZ), maxZ: Math.max(minZ, maxZ), tag, on: true };
    this.boxes.push(b);
    return b;
  }

  // centre + half sizes
  boxC(cx, cz, hx, hz, tag) {
    return this.box(cx - hx, cz - hz, cx + hx, cz + hz, tag);
  }

  circle(x, z, r, tag = '') {
    const c = { x, z, r, tag, on: true };
    this.circles.push(c);
    return c;
  }

  remove(c) {
    let i = this.circles.indexOf(c);
    if (i >= 0) this.circles.splice(i, 1);
    i = this.boxes.indexOf(c);
    if (i >= 0) this.boxes.splice(i, 1);
  }

  // Push vector for one circle, or null.
  pushOne(x, z, r, ignore) {
    let px = 0, pz = 0, hit = null;
    for (const b of this.boxes) {
      if (!b.on || (ignore && skip(ignore, b))) continue;
      if (x + r <= b.minX || x - r >= b.maxX || z + r <= b.minZ || z - r >= b.maxZ) continue;
      const qx = x < b.minX ? b.minX : x > b.maxX ? b.maxX : x;
      const qz = z < b.minZ ? b.minZ : z > b.maxZ ? b.maxZ : z;
      let dx = x - qx, dz = z - qz;
      const d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d > 1e-6) {
        px += (dx / d) * (r - d);
        pz += (dz / d) * (r - d);
      } else {
        // centre inside the box: leave by the shortest way
        const l = x - b.minX + r, rr = b.maxX - x + r, t = z - b.minZ + r, bb = b.maxZ - z + r;
        const m = Math.min(l, rr, t, bb);
        if (m === l) px -= l; else if (m === rr) px += rr; else if (m === t) pz -= t; else pz += bb;
      }
      hit = b;
    }
    for (const c of this.circles) {
      if (!c.on || (ignore && skip(ignore, c))) continue;
      const dx = x - c.x, dz = z - c.z;
      const rr = r + c.r;
      const d2 = dx * dx + dz * dz;
      if (d2 >= rr * rr) continue;
      const d = Math.sqrt(d2) || 1e-4;
      px += (dx / d) * (rr - d);
      pz += (dz / d) * (rr - d);
      hit = c;
    }
    return hit ? { x: px, z: pz, hit } : null;
  }

  // body: array of {x, z, r} in world space. Returns the total correction.
  resolve(body, ignore, iterations = 4) {
    let tx = 0, tz = 0, hit = null;
    for (let it = 0; it < iterations; it++) {
      let moved = false;
      for (const c of body) {
        const p = this.pushOne(c.x + tx, c.z + tz, c.r, ignore);
        if (!p) continue;
        // clamp so a deep overlap can't teleport you through a wall
        const m = Math.hypot(p.x, p.z);
        const k = m > 0.25 ? 0.25 / m : 1;
        tx += p.x * k;
        tz += p.z * k;
        hit = p.hit;
        moved = true;
      }
      if (!moved) break;
    }
    return { x: tx, z: tz, hit };
  }

  blocked(body, ignore) {
    for (const c of body) if (this.pushOne(c.x, c.z, c.r, ignore)) return true;
    return false;
  }
}

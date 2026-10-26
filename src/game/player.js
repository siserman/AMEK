// First-person walking, optionally pushing a cart.
import { clamp, damp } from '../util.js';

export const EYE = 1.64;

export class Player {
  constructor() {
    this.x = 0; this.z = 0;
    this.yaw = 0; this.pitch = 0;
    this.vx = 0; this.vz = 0;
    this.r = 0.28;
    this.cart = null; // the cart being pushed
    this.bob = 0;
    this.speed = 0;
    this.sens = 0.0024;
  }

  get fx() { return -Math.sin(this.yaw); }
  get fz() { return -Math.cos(this.yaw); }

  place(x, z, yaw) {
    this.x = x; this.z = z; this.yaw = yaw; this.vx = this.vz = 0;
    if (this.cart) this.syncCart();
  }

  cartPose(x = this.x, z = this.z, yaw = this.yaw) {
    return { x: x - Math.sin(yaw) * 0.82, z: z - Math.cos(yaw) * 0.82, yaw };
  }

  syncCart() {
    const p = this.cartPose();
    this.cart.setPose(p.x, p.z, p.yaw);
  }

  body(x, z, yaw) {
    const b = [{ x, z, r: this.r }];
    if (this.cart) {
      const p = this.cartPose(x, z, yaw);
      b.push(...this.cart.circles(p.x, p.z, p.yaw));
    }
    return b;
  }

  update(dt, input, col, ignore) {
    // look
    const prevYaw = this.yaw;
    this.yaw -= input.lookX * this.sens;
    this.pitch = clamp(this.pitch - input.lookY * this.sens, -1.35, 1.25);
    // with a cart, turning swings the cart; don't let it swing into a shelf
    const cp = this.cartPose();
    if (this.cart && this.yaw !== prevYaw && col.blocked(this.cart.circles(cp.x, cp.z, cp.yaw), ignore)) {
      const corr = col.resolve(this.body(this.x, this.z, this.yaw), ignore);
      if (Math.hypot(corr.x, corr.z) < 0.12) {
        this.x += corr.x; this.z += corr.z;
      } else this.yaw = prevYaw;
    }
    // move
    const a = input.axis();
    const run = input.running && !this.cart ? 2.9 : this.cart ? 1.45 : 1.55;
    const fx = this.fx, fz = this.fz, rx = -fz, rz = fx;
    const tx = (fx * a.y + rx * a.x) * run, tz = (fz * a.y + rz * a.x) * run;
    this.vx = damp(this.vx, tx, this.cart ? 5 : 9, dt);
    this.vz = damp(this.vz, tz, this.cart ? 5 : 9, dt);
    let nx = this.x + this.vx * dt, nz = this.z + this.vz * dt;
    const corr = col.resolve(this.body(nx, nz, this.yaw), ignore);
    nx += corr.x; nz += corr.z;
    this.speed = Math.hypot(nx - this.x, nz - this.z) / Math.max(dt, 1e-4);
    this.x = nx; this.z = nz;
    if (this.cart) this.syncCart();
    this.bob += dt * this.speed * 6.5;
  }

  eyeY() {
    return EYE + Math.sin(this.bob) * 0.025 * Math.min(1, this.speed / 1.5);
  }
}

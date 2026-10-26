// Your car: simple bicycle-model driving, a boot that holds the shopping.
import * as THREE from '../../vendor/three.module.min.js';
import { makeCar, CAR } from '../world/models.js';
import { Packer, HeightMap } from './cart.js';
import { clamp, damp } from '../util.js';

export class PlayerCar {
  constructor(scene) {
    this.group = makeCar('#2f5d8a');
    scene.add(this.group);
    const u = this.group.userData;
    this.lid = u.lid;
    this.boot = u.boot;
    this.x = 0; this.z = 0; this.heading = 0;
    this.speed = 0; this.steer = 0;
    this.lidOpen = 0; this.lidTarget = 0;
    this.items = [];
    this.colliders = null;
    this.bumped = 0;
    // same packer as the cart, sized to the boot of a Kombi (local to the boot group)
    this.packer = new Packer([{ map: new HeightMap(-0.7, 0.7, -0.5, 0.52, 0, 0.6) }]);
  }

  place(x, z, heading) {
    this.x = x; this.z = z; this.heading = heading; this.speed = 0;
    this.sync();
  }

  get fx() { return -Math.sin(this.heading); }
  get fz() { return -Math.cos(this.heading); }

  sync() {
    this.group.position.set(this.x, 0, this.z);
    this.group.rotation.y = this.heading;
  }

  circles(x = this.x, z = this.z, h = this.heading) {
    const fx = -Math.sin(h), fz = -Math.cos(h);
    return [-1.55, -0.52, 0.52, 1.55].map((o) => ({ x: x + fx * o, z: z + fz * o, r: 0.88 }));
  }

  park(col) {
    this.unpark(col);
    this.colliders = this.circles().map((c) => col.circle(c.x, c.z, c.r - 0.02, 'mycar'));
  }
  unpark(col) {
    if (this.colliders) for (const c of this.colliders) col.remove(c);
    this.colliders = null;
  }

  local(lx, lz) {
    const s = Math.sin(this.heading), c = Math.cos(this.heading);
    return { x: this.x + lx * c + lz * s, z: this.z - lx * s + lz * c };
  }
  door() { return this.local(-1.25, -0.25); }
  trunk() { return this.local(0, 2.95); }

  update(dt, input, col, ignore) {
    const a = input.axis();
    const brake = input.held('brake');
    let acc = 0;
    if (a.y > 0.05) acc = this.speed < -0.2 ? 9 : 3.6 * a.y;
    else if (a.y < -0.05) acc = this.speed > 0.2 ? -9 : -2.6 * -a.y;
    if (brake) acc = -Math.sign(this.speed) * 11;
    this.speed += acc * dt;
    if (Math.abs(a.y) < 0.05 && !brake) this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), (0.6 + Math.abs(this.speed) * 0.08) * dt);
    if (brake && Math.abs(this.speed) < 0.3) this.speed = 0;
    this.speed = clamp(this.speed, -4.2, 13.9);
    const maxSteer = 0.6 - Math.min(0.4, Math.abs(this.speed) * 0.025);
    this.steer = damp(this.steer, -a.x * maxSteer, 6, dt);
    this.heading += (this.speed / CAR.wheelbase) * Math.tan(this.steer) * dt;
    let nx = this.x + this.fx * this.speed * dt, nz = this.z + this.fz * this.speed * dt;
    const corr = col.resolve(this.circles(nx, nz, this.heading), ignore, 3);
    if (corr.hit) {
      nx += corr.x; nz += corr.z;
      if (Math.abs(this.speed) > 1.5) this.bumped = Math.abs(this.speed);
      this.speed *= 0.25;
    }
    this.x = nx; this.z = nz;
    this.sync();
  }

  animate(dt) {
    this.lidOpen = damp(this.lidOpen, this.lidTarget, 5, dt);
    this.lid.rotation.x = this.lidOpen * 1.25;
  }

  addToBoot(item) {
    const m = this.packer.place(item, this.items.length * 13 + 5);
    if (!m) return false;
    this.items.push(item);
    item.mesh.matrixAutoUpdate = false;
    item.mesh.matrix.copy(m);
    this.boot.add(item.mesh);
    return true;
  }

  removeFromBoot(item) {
    const i = this.items.indexOf(item);
    if (i < 0) return;
    this.items.splice(i, 1);
    this.boot.remove(item.mesh);
  }

  bootWorld(v = new THREE.Vector3()) {
    this.group.updateMatrixWorld();
    return this.boot.getWorldPosition(v);
  }
}

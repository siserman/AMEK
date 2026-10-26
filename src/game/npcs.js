// Other shoppers. They push carts around fixed loops through the market and
// wait politely when you are in their way.
import * as THREE from '../../vendor/three.module.min.js';
import { makePerson, animateWalk, makeCart } from '../world/models.js';
import { rng } from '../util.js';

// loops through the aisles (x, z)
const LOOPS = [
  [[15.6, 7.5], [15.6, -7.5], [12.2, -8.8], [8.6, -10.8], [8.6, 1.6], [12.2, 5.5]],
  [[5.2, 1.6], [5.2, -10.6], [1.8, -10.6], [1.8, 1.6]],
  [[-1.5, 1.6], [-1.5, -10.6], [-5.8, -10.6], [-5.8, 1.6]],
  [[-9.4, 1.8], [-9.4, -10.2], [-5.8, -10.6], [-5.8, -2], [-5.8, 1.6]],
  [[8.6, -10.8], [-9.6, -10.8], [-9.6, -9.6], [8.6, -9.6]],
  [[11.9, 1.8], [11.9, -6.5], [8.6, -9.4], [8.6, 1.8]],
];

const LOOKS = [
  { shirt: '#b5523b', pants: '#2b2f3a', hair: '#2b1d14', skin: '#e0b48f' },
  { shirt: '#3f6e9e', pants: '#45403a', hair: '#c9a46a', skin: '#f0c8a8' },
  { shirt: '#6b8f4e', pants: '#24262b', hair: '#8a8a8a', skin: '#c99273', tall: 0.96 },
  { shirt: '#e8e2d4', pants: '#3a4a6b', hair: '#4a2a1a', skin: '#8d5a3c' },
  { shirt: '#7a3b6b', pants: '#2b2f3a', hair: '#1a1a1a', skin: '#e8bfa0', tall: 0.94 },
  { shirt: '#d9a23b', pants: '#5d6267', hair: '#6b4a2a', skin: '#f2cdb0', tall: 1.03 },
];

export class Shoppers {
  constructor(game) {
    this.game = game;
    this.list = [];
    const R = rng(77);
    LOOPS.forEach((loop, i) => {
      const person = makePerson(LOOKS[i % LOOKS.length]);
      person.userData.pushing = true;
      person.userData.armL.rotation.x = person.userData.armR.rotation.x = -1.0;
      const cart = makeCart();
      const n = 2 + Math.floor(R() * 7);
      for (let k = 0; k < n; k++) {
        const p = game.data.products[Math.floor(R() * game.data.products.length)];
        if (p.dim[0] * p.dim[1] * p.dim[2] > 0.01) continue;
        const m = game.ps.mesh(p);
        m.position.set((R() - 0.5) * 0.25, 0.53, (R() - 0.5) * 0.5);
        m.rotation.y = R() * Math.PI;
        cart.userData.contents.add(m);
      }
      game.scene.add(person, cart);
      const seg = Math.floor(R() * loop.length);
      const t = R();
      const a = loop[seg], b = loop[(seg + 1) % loop.length];
      const npc = {
        person, cart, loop, seg, x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t,
        yaw: 0, speed: 0.75 + R() * 0.35, wait: 0, browse: 2 + R() * 6,
        col: [game.col.circle(0, 0, 0.3, 'npc'), game.col.circle(0, 0, 0.3, 'npc')],
      };
      this.list.push(npc);
    });
  }

  update(dt) {
    const pl = this.game.player;
    for (const n of this.list) {
      const target = n.loop[(n.seg + 1) % n.loop.length];
      const dx = target[0] - n.x, dz = target[1] - n.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.25) {
        n.seg = (n.seg + 1) % n.loop.length;
        continue;
      }
      const wantYaw = Math.atan2(-dx, -dz);
      let dy = wantYaw - n.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      n.yaw += Math.max(-2 * dt, Math.min(2 * dt, dy));
      // stop for the player (and for a moment now and then, to look at a shelf)
      const fx = -Math.sin(n.yaw), fz = -Math.cos(n.yaw);
      const ahead = (this.game.mode === 'walk' ? Math.hypot(pl.x - (n.x + fx * 1.1), pl.z - (n.z + fz * 1.1)) : 99) < 1.2;
      let blocked = ahead;
      // two shoppers meeting head-on: after a moment one squeezes past
      if (n.squeeze > 0) n.squeeze -= dt;
      else for (const o of this.list) if (o !== n && Math.hypot(o.x - (n.x + fx * 1.4), o.z - (n.z + fz * 1.4)) < 0.9) blocked = true;
      n.blockT = blocked && !ahead ? (n.blockT || 0) + dt : 0;
      if (n.blockT > 2.5) n.squeeze = 3;
      n.browse -= dt;
      if (n.browse < 0) {
        n.wait = 1.5 + Math.random() * 3;
        n.browse = 6 + Math.random() * 12;
      }
      let v = 0;
      if (n.wait > 0) n.wait -= dt;
      else if (!blocked && Math.abs(dy) < 1.2) v = n.speed;
      n.x += fx * v * dt;
      n.z += fz * v * dt;
      n.person.position.set(n.x, 0, n.z);
      n.person.rotation.y = n.yaw;
      n.cart.position.set(n.x + fx * 0.82, 0, n.z + fz * 0.82);
      n.cart.rotation.y = n.yaw;
      n.col[0].x = n.x; n.col[0].z = n.z;
      n.col[1].x = n.x + fx * 0.85; n.col[1].z = n.z + fz * 0.85; n.col[1].r = 0.42;
      animateWalk(n.person, v, dt);
    }
  }
}

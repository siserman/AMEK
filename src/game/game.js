// The whole trip, start to finish: drive in, park, get a cart, shop, pay,
// pack, load the boot, return the cart, drive home.
import * as THREE from '../../vendor/three.module.min.js';
import { Player } from './player.js';
import { Cart } from './cart.js';
import { PlayerCar } from './car.js';
import { Checkout } from './checkout.js';
import { Shoppers } from './npcs.js';
import { STORE, DOORS, GATE, CORRAL, PFAND, START, STREET, LOT } from '../world/layout.js';
import { euro, kg, damp, clamp, wrapAngle } from '../util.js';

const DENOMS = [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
export const LEERGUT = { id: 'leergut', name: 'Leergut-Beutel', bon: 'Leergut', dim: [0.3, 0.34, 0.22], shape: 'bag', index: -1, tags: [], special: true, bottles: 8, pfandEach: 25 };

const ANNOUNCEMENTS = [
  'Liebe Kundinnen und Kunden, an unserer Backstation gibt es jetzt frische Laugenbrezeln.',
  'Diese Woche im Angebot: Pommes Frites, ein Kilo, für nur 1,49 Euro.',
  'Bitte denken Sie an Ihr Leergut. Unser Pfandautomat steht direkt am Eingang.',
  'Neu eingetroffen: Lebkuchen und Spekulatius – im Gang bei Obst und Gemüse.',
  'Wir schließen heute um 22 Uhr. Vielen Dank für Ihren Einkauf bei AMEK.',
  'Kaffee Caffè Crema, ganze Bohne, ein Kilo: heute 10,99 Euro statt 13,99.',
];

export class Game {
  constructor(env) {
    Object.assign(this, env); // renderer, world, data, input, audio, hud, ui
    this.scene = this.world.scene;
    this.col = this.world.col;
    this.ps = this.world.ps;
    this.store = this.world.store;
    this.camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.08, 600);
    this.player = new Player();
    this.car = new PlayerCar(this.scene);
    this.cart = null;
    this.checkout = new Checkout(this, this.store.lanes.find((l) => l.open));
    this.shoppers = new Shoppers(this);
    this.tweens = [];
    this.mode = 'intro';
    this.paused = false;
    this.focus = null;
    this.itemSeq = 0;
    this.owned = [];
    this.orbit = 0;
    this.cockpit = false;
    this.camPos = new THREE.Vector3(START.x, 3, START.z + 6);
    this.repeatT = 0;
    this.paTimer = 25;
    this.walkIgnore = (c) => c.tag === 'curb' || c.tag === 'bound';
    this.carIgnore = (c) => c.tag === 'npc';
    this.interactables = this.buildInteractables();
    this.ray = new THREE.Vector3();
  }

  // --- setup ------------------------------------------------------------
  start(list) {
    const d = new Date();
    d.setHours(10, 12, 0, 0);
    this.state = {
      list,
      wallet: { 2000: 1, 1000: 1, 500: 1, 200: 2, 100: 2, 50: 1, 20: 2, 10: 1, 5: 2, 2: 1, 1: 3 },
      card: { name: 'girocard', balance: 84213, pin: '4711' },
      startDate: d.getTime(),
      t: 0,
      hands: [],
      pfandBon: 0,
      pfandReturned: 0,
      coin: false,
      parkedSpace: null,
      parkTime: null,
      flags: {},
      receipts: [],
      stats: { picked: 0, putBack: 0, walked: 0 },
    };
    this.car.place(START.x, START.z, START.heading);
    this.leergut = this.makeItem(LEERGUT);
    this.car.addToBoot(this.leergut);
    this.mode = 'drive';
    this.hud.toast('Samstagvormittag. Der Kühlschrank ist leer – auf zu AMEK.', 'info', 5000);
  }

  clockDate() {
    return new Date(this.state.startDate + this.state.t * 1000);
  }

  cash() {
    let s = 0;
    for (const [k, v] of Object.entries(this.state.wallet)) s += k * v;
    return s;
  }

  makeItem(p) {
    let weight = null, price = p.price || 0;
    if (p.loose) {
      const [a, b] = p.loose;
      weight = Math.round((a + Math.random() * (b - a)) * 1000) / 1000;
      price = Math.round(weight * p.price);
    }
    const mesh = p.special ? leergutMesh() : this.ps.mesh(p);
    const item = { id: ++this.itemSeq, p, weight, price, paid: false, scanned: false, mesh };
    if (!p.special) this.owned.push(item);
    return item;
  }

  disown(item) {
    const i = this.owned.indexOf(item);
    if (i >= 0) this.owned.splice(i, 1);
  }

  // --- queries --------------------------------------------------------------
  get indoors() {
    const x = this.mode === 'drive' ? this.car.x : this.player.x;
    const z = this.mode === 'drive' ? this.car.z : this.player.z;
    return x > STORE.x0 && x < STORE.x1 && z > STORE.z0 && z < STORE.z1 + 0.2;
  }

  personItems() {
    return [...(this.cart ? this.cart.items : []), ...this.state.hands];
  }
  hasUnpaid() {
    return this.personItems().some((i) => !i.p.special && !i.paid);
  }
  hasUnpaidOnPerson() {
    return this.personItems().some((i) => !i.p.special && !i.scanned);
  }
  nearCart(r = 3) {
    if (!this.cart) return null;
    if (this.player.cart) return this.cart;
    const h = this.cart.handle();
    return Math.hypot(h.x - this.player.x, h.z - this.player.z) < r ? this.cart : null;
  }

  listProgress() {
    const l = this.state.list;
    return l.items.map((it) => {
      const n = this.owned.filter((o) => it.ids.has(o.p.id)).length;
      return { label: it.label, need: it.count, have: Math.min(n, it.count) };
    });
  }

  // --- interactables --------------------------------------------------------
  buildInteractables() {
    const g = this;
    const C = CORRAL;
    const lane = this.checkout.lane;
    return [
      {
        key: 'car-door', r: 1.6,
        pos: () => g.car.door(),
        label: () => 'Einsteigen',
        act: () => g.enterCar(),
      },
      {
        key: 'trunk', r: 1.8,
        pos: () => g.car.trunk(),
        label: () => {
          if (g.car.items.includes(g.leergut)) return 'Leergut aus dem Kofferraum nehmen';
          const c = g.nearCart(3.5);
          if (c && c.items.some((i) => i.paid)) return 'Einkäufe einladen';
          return g.car.lidTarget ? 'Kofferraum schließen' : 'Kofferraum öffnen';
        },
        act: () => g.useTrunk(),
      },
      {
        key: 'corral', r: 2.6,
        pos: () => ({ x: (C.x0 + C.x1) / 2, z: C.z1 + 0.3 }),
        label: () => {
          if (!g.cart) return 'Einkaufswagen nehmen (1 € einwerfen)';
          if (g.player.cart) return g.cart.items.length ? 'Der Wagen ist noch nicht leer' : 'Wagen zurückstellen (1 € zurück)';
          return null;
        },
        act: () => (g.cart ? g.returnCart() : g.takeCart()),
      },
      {
        key: 'own-cart', r: 1.5,
        pos: () => g.cart.handle(),
        when: () => g.cart && !g.player.cart,
        label: () => (g.state.hands.length ? 'In den Wagen legen und schieben' : 'Wagen schieben'),
        act: () => g.grabCart(),
      },
      {
        key: 'pfand', r: 1.8,
        pos: () => ({ x: PFAND.x - 0.2, z: PFAND.z }),
        label: () => {
          if (g.pfandFeed) return null;
          if (g.personItems().includes(g.leergut)) return `Leergut einwerfen (${LEERGUT.bottles} Flaschen)`;
          return g.state.pfandReturned ? null : 'Pfandautomat (du hast kein Leergut dabei)';
        },
        act: () => g.feedPfand(),
      },
      {
        key: 'belt', r: 1.9,
        pos: () => ({ x: lane.lane[0] + 0.45, z: 7.7 }),
        when: () => g.checkout.atBelt(g.player.x, g.player.z) && g.hasUnpaidOnPerson(),
        label: () => `Aufs Band legen (${g.personItems().filter((i) => !i.p.special && !i.scanned).length} übrig, E halten)`,
        act: () => g.loadBelt(),
        repeat: true,
      },
      {
        key: 'bay', r: 1.9,
        pos: () => ({ x: lane.lane[0] + 0.45, z: 10.0 }),
        when: () => g.checkout.atBay(g.player.x, g.player.z) && g.checkout.bay.length > 0,
        label: () => `In den Wagen packen (${g.checkout.bay.length}, E halten)`,
        act: () => g.packFromBay(),
        repeat: true,
      },
      {
        key: 'terminal', r: 1.7, minDot: 0.55, bias: 0.25,
        pos: () => lane.terminal,
        when: () => g.checkout.state === 'total',
        label: () => `Bezahlen: ${euro(g.checkout.total)} €`,
        act: () => g.openPay(),
      },
    ];
  }

  updateFocus() {
    const pl = this.player;
    const o = this.camera.position;
    const dir = this.ray.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const hit = this.ps.pick(o, dir, 2.5);
    let best = null, bestS = Infinity;
    const fx = pl.fx, fz = pl.fz;
    for (const it of this.interactables) {
      if (it.when && !it.when()) continue;
      if (it.key.startsWith('car') || it.key === 'trunk') if (this.mode !== 'walk') continue;
      const p = it.pos();
      const dx = p.x - pl.x, dz = p.z - pl.z;
      const d = Math.hypot(dx, dz);
      if (d > it.r) continue;
      const dot = d > 0.01 ? (dx * fx + dz * fz) / d : 1;
      if ((d > 0.7 && dot < 0.35) || dot < (it.minDot ?? -1)) continue;
      const label = it.label();
      if (label === null) continue;
      const s = d - dot * 0.8 + (it.bias || 0);
      if (s < bestS) {
        bestS = s;
        best = it;
      }
    }
    if (hit && (!best || bestS > 0.3)) this.focus = { kind: 'product', hit };
    else if (best) this.focus = { kind: 'inter', it: best };
    else this.focus = null;
  }

  // --- actions ----------------------------------------------------------------
  use() {
    const f = this.focus;
    if (!f) return;
    if (f.kind === 'product') this.takeProduct(f.hit);
    else f.it.act();
  }

  takeProduct(hit) {
    // aiming into a gap between packs still means "one of those, please"
    const rec = hit.inst || this.ps.frontOfSlot(hit.slot);
    if (!rec) return this.hud.toast('Hier ist nichts mehr.', 'warn');
    const p = rec.p;
    const container = this.nearCart(3.2);
    if (!container && this.state.hands.length >= 4) return this.hud.toast('Deine Hände sind voll. Ein Einkaufswagen hilft.', 'warn');
    const from = boxCenter(rec.box);
    if (!this.ps.take(rec)) return this.hud.toast('Leider ausverkauft.', 'warn');
    const item = this.makeItem(p);
    if (container) {
      if (!container.add(item)) {
        this.ps.putBack(p, rec.slot);
        this.disown(item);
        return this.hud.toast('Der Wagen ist voll.', 'warn');
      }
      this.ghostFly(item, from, container.worldOf(item));
    } else {
      this.state.hands.push(item);
    }
    this.audio.pick();
    this.state.stats.picked++;
    if (p.loose) this.hud.toast(`${p.name}: ${kg(item.weight)} – wird an der Kasse gewogen.`, 'info');
    if (p.section === 'backstation' && !this.state.flags.tongs) {
      this.state.flags.tongs = true;
      this.hud.toast('Mit der Zange in die Papiertüte. Hygiene!', 'info');
    }
  }

  putBack() {
    const f = this.focus;
    if (!f || f.kind !== 'product') return;
    const slot = f.hit.slot;
    const p = slot.p;
    const cart = this.nearCart(3.2);
    const pool = [...this.state.hands, ...(cart ? cart.items : [])];
    const item = pool.reverse().find((i) => i.p === p && !i.scanned && !i.paid);
    if (!item) return;
    if (this.state.hands.includes(item)) this.state.hands.splice(this.state.hands.indexOf(item), 1);
    else cart.remove(item);
    this.ps.putBack(p, slot);
    this.disown(item);
    this.audio.drop();
    this.state.stats.putBack++;
  }

  // the Q action outside the shelves: drop the last thing in your hands into the cart
  canPutBack() {
    const f = this.focus;
    if (!f || f.kind !== 'product') return false;
    const p = f.hit.slot.p;
    const cart = this.nearCart(3.2);
    return [...this.state.hands, ...(cart ? cart.items : [])].some((i) => i.p === p && !i.scanned && !i.paid);
  }

  takeCart() {
    if (!this.state.wallet[100]) {
      return this.hud.toast('Du hast keine 1-€-Münze mehr.', 'warn');
    }
    const c = this.world.exterior.corral;
    const mesh = c.carts.pop();
    if (!mesh) return this.hud.toast('Kein Wagen mehr da.', 'warn');
    c.stack.remove(mesh);
    c.block.maxZ -= 0.27;
    this.state.wallet[100]--;
    this.state.coin = true;
    this.audio.coin();
    this.audio.clack();
    this.cart = new Cart(this.scene);
    const pl = this.player;
    this.cart.unpark(this.col);
    pl.cart = this.cart;
    // pulled out of the corral and turned towards the shop (west)
    pl.x = c.cx + 0.4;
    pl.z = CORRAL.z1 + 0.9;
    pl.yaw = Math.PI / 2;
    pl.syncCart();
    const corr = this.col.resolve(pl.body(pl.x, pl.z, pl.yaw), this.walkIgnore, 8);
    pl.x += corr.x; pl.z += corr.z;
    pl.syncCart();
    for (const it of this.state.hands.splice(0)) this.cart.add(it);
    this.hud.toast('1 € eingeworfen, Wagen ausgeklinkt.', 'info');
    this.state.flags.cart = true;
  }

  returnCart() {
    if (!this.player.cart) return;
    if (this.cart.items.length) return this.hud.toast('Erst ausräumen – der Wagen ist noch nicht leer.', 'warn');
    const c = this.world.exterior.corral;
    this.scene.remove(this.cart.group);
    this.cart.group.rotation.y = 0;
    this.cart.group.position.set(c.cx, c.carts.length * 0.002, CORRAL.z0 + 0.6 + c.carts.length * 0.27);
    c.stack.add(this.cart.group);
    c.carts.push(this.cart.group);
    c.block.maxZ += 0.27;
    this.cart = null;
    this.player.cart = null;
    this.state.wallet[100] = (this.state.wallet[100] || 0) + 1;
    this.state.coin = false;
    this.state.flags.cartReturned = true;
    this.audio.clack();
    this.audio.coin();
    this.hud.toast('Wagen eingeklinkt – dein Euro ist zurück.', 'good');
  }

  grabCart() {
    if (!this.cart) return;
    const pl = this.player;
    if (pl.cart) {
      pl.cart = null;
      this.cart.park(this.col);
      this.hud.toast('Wagen abgestellt.', 'info', 1500);
      return;
    }
    const h = this.cart.handle();
    if (Math.hypot(h.x - pl.x, h.z - pl.z) > 1.6) return;
    this.cart.unpark(this.col);
    pl.cart = this.cart;
    pl.yaw = this.cart.yaw;
    pl.x = this.cart.x + Math.sin(this.cart.yaw) * 0.82;
    pl.z = this.cart.z + Math.cos(this.cart.yaw) * 0.82;
    const corr = this.col.resolve(pl.body(pl.x, pl.z, pl.yaw), this.walkIgnore, 8);
    pl.x += corr.x; pl.z += corr.z;
    pl.syncCart();
    for (const it of this.state.hands.splice(0)) if (!this.cart.add(it)) this.state.hands.push(it);
  }

  enterCar() {
    if (this.player.cart) {
      this.player.cart = null;
      this.cart.park(this.col);
    }
    this.car.unpark(this.col);
    this.mode = 'drive';
    this.orbit = 0;
    this.audio.carDoor();
    this.car.lidTarget = 0;
  }

  exitCar() {
    if (Math.abs(this.car.speed) > 0.6) return this.hud.toast('Erst anhalten.', 'warn');
    if (this.car.z > STREET.z0 - 0.5) return this.hud.toast('Auf der Straße steigst du besser nicht aus.', 'warn');
    const space = this.parkedSpace();
    if (!space && !this.state.flags.outOfCar) this.hud.toast('Du stehst nicht in einer Parklücke … na gut.', 'warn');
    if (space && !this.state.parkTime) {
      this.state.parkTime = this.clockDate();
      const t = new Date(Math.ceil(this.state.parkTime.getTime() / 1800000) * 1800000);
      this.hud.toast(`Parkscheibe auf ${t.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} gestellt.`, 'info');
    }
    if (space?.kind === 'disabled') this.hud.toast('Das ist ein Behindertenparkplatz. Das kostet 55 € Bußgeld …', 'warn', 5000);
    if (space?.kind === 'family') this.hud.toast('Eltern-Kind-Parkplatz. Ist heute ein Kind dabei?', 'info');
    this.state.parkedSpace = space;
    this.car.speed = 0;
    this.car.park(this.col);
    const pl = this.player;
    const d = this.car.door();
    pl.place(d.x, d.z, this.car.heading + Math.PI / 2);
    pl.pitch = -0.05;
    const corr = this.col.resolve(pl.body(pl.x, pl.z, pl.yaw), this.walkIgnore, 10);
    pl.x += corr.x; pl.z += corr.z;
    this.mode = 'walk';
    this.state.flags.outOfCar = true;
    this.audio.carDoor();
  }

  parkedSpace() {
    const c = this.car;
    if (Math.abs(c.speed) > 0.4) return null;
    const along = Math.abs(Math.sin(c.heading));
    if (along > 0.35) return null;
    for (const s of this.world.exterior.spaces) {
      if (s.occupied) continue;
      if (Math.abs(c.x - s.x) < 0.75 && Math.abs(c.z - s.z) < 1.4) return s;
    }
    return null;
  }

  useTrunk() {
    const car = this.car;
    car.lidTarget = 1;
    this.audio.trunk();
    if (car.items.includes(this.leergut)) {
      const cart = this.nearCart(3.5);
      car.removeFromBoot(this.leergut);
      if (cart && cart.add(this.leergut)) {
        this.ghostFly(this.leergut, car.bootWorld(), cart.worldOf(this.leergut));
      } else if (this.state.hands.length < 4) {
        this.state.hands.push(this.leergut);
      } else car.addToBoot(this.leergut);
      this.hud.toast('Leergut dabei: 8 Pfandflaschen à 0,25 €.', 'info');
      return;
    }
    const cart = this.nearCart(3.5);
    if (cart && cart.items.some((i) => i.paid)) {
      const items = cart.items.filter((i) => i.paid);
      let i = 0, failed = 0;
      for (const it of items) {
        cart.remove(it);
        const from = cart.group.position.clone().setY(0.9);
        if (car.addToBoot(it)) {
          const to = car.bootWorld().clone();
          this.ghostFly(it, from, to, 0.35 + i * 0.05);
        } else {
          failed++;
          cart.add(it);
        }
        i++;
      }
      // hands too
      for (const it of this.state.hands.splice(0)) if (!car.addToBoot(it)) this.state.hands.push(it);
      this.state.flags.loaded = true;
      this.hud.toast(failed ? `Kofferraum voll – ${failed} Teile bleiben im Wagen.` : 'Alles eingeladen.', failed ? 'warn' : 'good');
      return;
    }
    if (this.state.hands.length && this.state.hands.every((i) => i.paid)) {
      for (const it of this.state.hands.splice(0)) car.addToBoot(it);
      this.state.flags.loaded = true;
      return;
    }
    car.lidTarget = car.lidOpen > 0.5 ? 0 : 1;
  }

  feedPfand() {
    const items = this.personItems();
    if (!items.includes(this.leergut)) return this.hud.toast('Du hast kein Leergut dabei. Das liegt noch im Kofferraum.', 'info');
    this.pfandFeed = { n: 0, t: 0.4 };
    if (this.cart && this.cart.items.includes(this.leergut)) this.cart.remove(this.leergut);
    const h = this.state.hands.indexOf(this.leergut);
    if (h >= 0) this.state.hands.splice(h, 1);
  }

  updatePfand(dt) {
    const f = this.pfandFeed;
    if (!f) return;
    f.t -= dt;
    if (f.t > 0) return;
    if (f.n < LEERGUT.bottles) {
      this.audio.bottle(f.n);
      f.n++;
      f.t = 0.6;
      this.hud.setPfand(f.n, LEERGUT.bottles, f.n * LEERGUT.pfandEach);
    } else {
      const v = LEERGUT.bottles * LEERGUT.pfandEach;
      this.state.pfandBon += v;
      this.state.pfandReturned += v;
      this.audio.printer();
      this.hud.setPfand(null);
      this.hud.toast(`Pfandbon über ${euro(v)} € gedruckt. Den gibst du an der Kasse ab.`, 'good', 4500);
      this.pfandFeed = null;
    }
  }

  loadBelt() {
    const pool = this.personItems().filter((i) => !i.p.special && !i.scanned && !this.checkout.belt.some((b) => b.item === i));
    const item = pool.find((i) => this.state.hands.includes(i)) || pool[pool.length - 1];
    if (!item) return;
    const fromHands = this.state.hands.includes(item);
    let from;
    if (fromHands) {
      this.state.hands.splice(this.state.hands.indexOf(item), 1);
      from = this.camera.position.clone().add(new THREE.Vector3(0, -0.5, 0));
    } else {
      from = this.cart.worldOf(item);
      this.cart.remove(item);
    }
    if (!this.checkout.load(item, from)) {
      if (fromHands) this.state.hands.push(item);
      else this.cart.add(item);
      if (!this.warnedBelt) this.hud.toast('Das Band ist voll – kurz warten.', 'info', 1500);
      this.warnedBelt = true;
      return;
    }
    this.warnedBelt = false;
    item.onBelt = true;
    this.audio.drop();
  }

  packFromBay() {
    const b = this.checkout.takeFromBay();
    if (!b) return;
    const it = b.item;
    const from = b.mesh.position.clone();
    this.scene.remove(b.mesh);
    it.mesh.matrixAutoUpdate = false;
    it.mesh.rotation.set(0, 0, 0);
    it.mesh.position.set(0, 0, 0);
    const cart = this.nearCart(3.2);
    if (cart && cart.add(it)) {
      this.ghostFly(it, from, cart.worldOf(it), 0.22);
    } else if (this.state.hands.length < 4) {
      this.state.hands.push(it);
    } else {
      this.checkout.bay.unshift(b);
      it.mesh.matrixAutoUpdate = true;
      it.mesh.position.copy(from);
      this.scene.add(it.mesh);
      return this.hud.toast('Kein Platz mehr – Wagen näher ran.', 'warn');
    }
    this.audio.pick();
  }

  openPay() {
    this.input.releaseLock();
    this.ui.openPay(this.checkout.total, this);
  }

  // called by the payment overlay
  payCard(pin) {
    const total = this.checkout.total;
    if (total > 5000 && pin !== this.state.card.pin) return { ok: false, error: 'PIN falsch. Bitte erneut eingeben.' };
    if (this.state.card.balance < total) return { ok: false, error: 'Zahlung abgelehnt: Konto nicht gedeckt.' };
    this.state.card.balance -= total;
    return this.finishPayment({ method: 'card', amount: total, pin: total > 5000 });
  }

  payCash(given) {
    const total = this.checkout.total;
    let sum = 0;
    for (const [k, v] of Object.entries(given)) sum += k * v;
    if (sum < total) return { ok: false, error: `Noch ${euro(total - sum)} € zu wenig.` };
    for (const [k, v] of Object.entries(given)) this.state.wallet[k] -= v;
    let change = sum - total;
    const coins = [];
    for (const d of DENOMS) {
      while (change >= d) {
        change -= d;
        coins.push(d);
        this.state.wallet[d] = (this.state.wallet[d] || 0) + 1;
      }
    }
    this.audio.coin();
    return this.finishPayment({ method: 'cash', amount: total, given: sum, change: sum - total, coins });
  }

  finishPayment(payment) {
    const receipt = this.checkout.complete(payment);
    this.state.receipts.push(receipt);
    this.state.flags.paid = true;
    this.audio.success();
    this.audio.printer();
    return { ok: true, receipt };
  }

  ghostFly(item, from, to, dur = 0.28) {
    const mesh = item.mesh;
    mesh.visible = false;
    const ghost = mesh.clone();
    ghost.matrixAutoUpdate = true;
    ghost.visible = true;
    ghost.position.copy(from);
    ghost.rotation.set(0, Math.random() * 6, 0);
    this.scene.add(ghost);
    this.fly(ghost, from, to, dur, () => {
      this.scene.remove(ghost);
      mesh.visible = true;
    });
  }

  fly(mesh, from, to, dur, done) {
    mesh.userData.flying = true;
    this.tweens.push({ mesh, from: from.clone(), to: to.clone(), t: 0, dur, done });
  }

  updateTweens(dt) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      const e = k * k * (3 - 2 * k);
      tw.mesh.position.lerpVectors(tw.from, tw.to, e);
      tw.mesh.position.y += Math.sin(k * Math.PI) * 0.18;
      if (k >= 1) {
        tw.mesh.userData.flying = false;
        this.tweens.splice(i, 1);
        tw.done && tw.done();
      }
    }
  }

  // --- doors and gate ------------------------------------------------------------
  updateDoors(dt) {
    const pl = this.player;
    const walking = this.mode === 'walk';
    for (const key of ['entry', 'exit']) {
      const d = this.store.doors[key];
      let want = 0;
      if (walking) {
        const dx = pl.x - d.x, dz = pl.z - (d.z + 0.15);
        const near = Math.abs(dx) < d.w / 2 + 1.0 && Math.abs(dz) < 2.7;
        if (near) {
          if (key === 'exit' && dz < 0) {
            if (this.hasUnpaid()) {
              if (!this.warnedExit) this.hud.toast('Halt! Im Wagen liegt noch unbezahlte Ware.', 'warn', 3500);
              this.warnedExit = true;
            } else want = 1;
          } else if (key === 'exit') want = Math.abs(dz) < 0.5 ? 1 : 0;
          else want = 1;
        } else if (key === 'exit') this.warnedExit = false;
      }
      if (want && !d.target) this.audio.door();
      d.target = want;
      d.open = damp(d.open, want, 4, dt);
      for (const leaf of d.leaves) leaf.position.x = leaf.userData.closedX + leaf.userData.dir * d.open * (d.w / 2 - 0.08);
      d.collider.on = d.open < 0.82;
    }
    // swing gate: opens only for people coming in
    const g = this.store.gate;
    const cx = (GATE.x0 + GATE.x1) / 2;
    let want = 0;
    if (walking && Math.abs(pl.x - cx) < 1.3 && pl.z > GATE.z - 0.25 && pl.z < GATE.z + 1.9) want = 1;
    if (want && g.open < 0.05) this.audio.gate();
    g.open = damp(g.open, want, 6, dt);
    for (const pivot of g.group.children) pivot.rotation.y = -pivot.userData.side * g.open * 1.45;
    g.collider.on = g.open < 0.6;
    if (walking && this.indoors && !this.state.flags.entered && pl.z < GATE.z - 0.5) {
      this.state.flags.entered = true;
      this.hud.toast('Willkommen bei AMEK!', 'good');
    }
  }

  // --- main loop -------------------------------------------------------------------
  update(dt) {
    if (this.mode === 'intro' || this.mode === 'end') {
      this.introCamera(dt);
      return;
    }
    const s = this.state;
    s.t += dt;
    const input = this.input;
    if (input.take('mute')) this.hud.toast(this.audio.toggleMute() ? 'Ton aus' : 'Ton an', 'info', 1200);
    if (input.take('list') && !this.ui.isOpen()) {
      this.input.releaseLock();
      this.ui.openCartList(this);
    }

    if (this.mode === 'drive') {
      this.car.update(dt, input, this.col, this.carIgnore);
      if (this.car.bumped) {
        this.audio.clack();
        this.car.bumped = 0;
      }
      if (input.take('use')) this.exitCar();
      if (input.take('view')) this.cockpit = !this.cockpit;
      if (input.take('horn')) this.audio.horn();
      // drove off after shopping
      if (this.state.flags.outOfCar && this.car.z > STREET.z0 + 1.2) this.finish();
    } else if (this.mode === 'walk') {
      const pl = this.player;
      const px = pl.x, pz = pl.z;
      pl.update(dt, input, this.col, this.walkIgnore);
      s.stats.walked += Math.hypot(pl.x - px, pl.z - pz);
      this.updateCameraWalk();
      this.updateFocus();
      if (input.take('use')) {
        this.use();
        this.repeatT = 0.35;
      } else if (input.held('use') && this.focus?.kind === 'inter' && this.focus.it.repeat) {
        this.repeatT -= dt;
        if (this.repeatT <= 0) {
          this.use();
          this.repeatT = 0.16;
        }
      }
      if (input.take('back')) this.putBack();
      if (input.take('cart')) this.grabCart();
      if (input.take('horn')) this.audio.horn();
    }
    this.car.animate(dt);
    this.updateDoors(dt);
    this.updatePfand(dt);
    this.checkout.update(dt);
    this.shoppers.update(dt);
    this.updateTweens(dt);
    // announcements
    if (this.indoors) {
      this.paTimer -= dt;
      if (this.paTimer <= 0) {
        this.paTimer = 70 + Math.random() * 50;
        this.audio.chime();
        this.hud.toast('Durchsage: ' + ANNOUNCEMENTS[Math.floor(Math.random() * ANNOUNCEMENTS.length)], 'pa', 6500);
      }
    }
    // reminder when leaving the market without the cart's coin
    this.audio.update(dt, {
      engineOn: this.mode === 'drive',
      rpm: Math.min(1, Math.abs(this.car.speed) / 14),
      cartSpeed: this.player.cart ? this.player.speed : 0,
      indoors: this.indoors,
    });
    if (this.mode === 'drive') this.updateCameraDrive(dt);
    this.hud.update(this);
    input.endFrame();
  }

  updateCameraWalk() {
    const pl = this.player;
    this.camera.position.set(pl.x, pl.eyeY(), pl.z);
    this.camera.rotation.set(pl.pitch, pl.yaw, 0, 'YXZ');
  }

  updateCameraDrive(dt) {
    const c = this.car;
    this.orbit = wrapAngle(this.orbit - this.input.lookX * 0.004);
    if (Math.abs(this.input.lookX) < 0.5) this.orbit = damp(this.orbit, 0, Math.abs(c.speed) > 1 ? 1.5 : 0.2, dt);
    if (this.cockpit) {
      const seat = c.local(-0.36, 0.1);
      this.camera.position.set(seat.x, 1.22, seat.z);
      this.camera.rotation.set(-0.06, c.heading + this.orbit, 0, 'YXZ');
      return;
    }
    const h = c.heading + this.orbit;
    const fx = -Math.sin(h), fz = -Math.cos(h);
    const want = new THREE.Vector3(c.x - fx * 6.4, 2.7, c.z - fz * 6.4);
    this.camPos.x = damp(this.camPos.x, want.x, 6, dt);
    this.camPos.y = damp(this.camPos.y, want.y, 6, dt);
    this.camPos.z = damp(this.camPos.z, want.z, 6, dt);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(c.x + fx * 2.5, 1.0, c.z + fz * 2.5);
  }

  introCamera(dt) {
    this.introT = (this.introT || 0) + dt * 0.05;
    const a = this.introT;
    this.camera.position.set(10 + Math.sin(a) * 22, 9 + Math.sin(a * 0.7) * 2, 36 + Math.cos(a) * 8);
    this.camera.lookAt(9, 2.2, 8);
  }

  finish() {
    this.mode = 'end';
    this.input.releaseLock();
    const s = this.state;
    const receipt = s.receipts[s.receipts.length - 1] || null;
    const progress = this.listProgress();
    this.ui.openEnd({
      receipt,
      progress,
      list: s.list,
      minutes: Math.round(s.t / 60),
      walked: Math.round(s.stats.walked),
      pfand: s.pfandReturned,
      cartReturned: !!s.flags.cartReturned,
      coinLost: !!this.cart,
      trunk: this.car.items.filter((i) => !i.p.special).length,
      leftInCart: this.cart ? this.cart.items.length : 0,
      parked: s.parkedSpace,
      cash: this.cash(),
      card: s.card.balance,
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  // --- debug & tests ---------------------------------------------------------------
  teleport(x, z, yaw = this.player.yaw, pitch = this.player.pitch) {
    this.player.place(x, z, yaw);
    this.player.pitch = pitch;
    this.updateCameraWalk();
  }
  aimAt(x, y, z) {
    const pl = this.player;
    const dx = x - pl.x, dz = z - pl.z, dy = y - pl.eyeY();
    pl.yaw = Math.atan2(-dx, -dz);
    pl.pitch = Math.atan2(dy, Math.hypot(dx, dz));
    if (pl.cart) pl.syncCart();
    this.updateCameraWalk();
    this.camera.updateMatrixWorld();
    this.updateFocus();
    return this.focus;
  }
}

function boxCenter(b) {
  return new THREE.Vector3((b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2);
}

function leergutMesh() {
  const g = new THREE.Group();
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.22), new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.5, transparent: true, opacity: 0.85 }));
  bag.position.y = 0.15;
  g.add(bag);
  const capM = new THREE.MeshStandardMaterial({ color: '#1d5fae' });
  for (let i = 0; i < 8; i++) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8), capM);
    cap.position.set(-0.1 + (i % 4) * 0.066, 0.31 + (i % 2) * 0.01, i < 4 ? -0.05 : 0.05);
    g.add(cap);
  }
  return g;
}

// The market without a player: customers arrive by car or on foot and do the
// whole circle, staff work shifts, a lorry delivers every morning, shelves
// empty during the day and get refilled. Runs from 1× to fast time-lapse.
import { SimClock, DAY, OPEN, CLOSE } from './clock.js';
import { Nav } from './nav.js';
import { Customer, Staff } from './people.js';
import { Vehicle, truckIn, truckBack, truckOut, DOCKED } from './vehicles.js';
import { Lighting } from './lighting.js';
import { Cart } from '../game/cart.js';
import { makeLitePerson, makeCar, makeTruck, makeRollCage } from '../world/models.js';
import { GATE, ANNEX, STAFF_DOOR } from '../world/layout.js';
import { rng } from '../util.js';

// how much of each section ends up in baskets (relative)
const SECTION_WEIGHT = {
  'obst-gemuese': 3.2, blumen: 0.35, backstation: 3.0, brot: 1.4, molkerei: 3.2, kaese: 1.8, wurst: 1.6, fleisch: 1.4, feinkost: 0.9,
  tk: 1.1, eis: 0.5, fruehstueck: 1.1, 'kaffee-tee': 1.0, 'nudeln-reis': 1.0, backen: 0.5, gewuerze: 0.35, 'saucen-oel': 0.9,
  konserven: 0.7, suesses: 1.4, knabbern: 1.1, saison: 0.7, wasser: 1.7, saefte: 1.3, 'bier-wein': 1.1, drogerie: 0.7, baby: 0.25,
  haushalt: 0.7, tier: 0.4, aktion: 0.18,
};
// customers per hour, by hour of the day
const WEEKDAY = [0, 0, 0, 0, 0, 0, 0, 40, 50, 60, 68, 74, 70, 56, 54, 66, 90, 104, 92, 68, 44, 22, 0, 0];
const SATURDAY = [0, 0, 0, 0, 0, 0, 0, 52, 88, 120, 134, 134, 120, 96, 82, 74, 70, 64, 52, 40, 26, 14, 0, 0];
// Friday is the big weekday shop; Tuesday the quietest
const DAY_FACTOR = [1.0, 0.94, 0.98, 1.04, 1.18, 1.0];

const SHIFTS = [
  { name: 'Anna', start: 5.4, end: 14.5, bay: 0, look: { hair: '#6b3a1f', skin: '#e8bfa0', pants: '#22262c' } },
  { name: 'Mehmet', start: 5.5, end: 14.5, bay: 1, look: { hair: '#1a1a1a', skin: '#c99273', pants: '#22262c' } },
  { name: 'Jonas', start: 5.9, end: 14.5, bay: null, look: { hair: '#c9a46a', skin: '#f0c8a8', pants: '#2b2f3a' } },
  { name: 'Sabine', start: 13.4, end: 22.5, bay: 2, look: { hair: '#8a8a8a', skin: '#f2cdb0', pants: '#22262c', tall: 0.96 } },
  { name: 'Lukas', start: 13.5, end: 22.5, bay: null, look: { hair: '#4a2a1a', skin: '#e0b48f', pants: '#2b2f3a', tall: 1.04 } },
  { name: 'Ewa', start: 13.9, end: 22.5, bay: 3, look: { hair: '#b5523b', skin: '#f0c8a8', pants: '#22262c', tall: 0.95 } },
  // extra hands for the weekend rush
  { name: 'Tobias', start: 9.4, end: 18.5, bay: null, days: [4, 5], look: { hair: '#2a2420', skin: '#8d5a3b', pants: '#2b2f3a', tall: 1.02 } },
  { name: 'Marie', start: 8.9, end: 17.5, bay: null, days: [5], look: { hair: '#d8b878', skin: '#f2cdb0', pants: '#22262c', tall: 0.97 } },
];

const SHIRTS = ['#b5523b', '#3f6e9e', '#6b8f4e', '#e8e2d4', '#7a3b6b', '#d9a23b', '#2b2f3a', '#c43c4f', '#5d6b75', '#f2f2f0', '#3a7d7a', '#8a5a2b'];
const PANTS = ['#2b2f3a', '#45403a', '#24262b', '#3a4a6b', '#5d6267', '#6b5a45', '#1d2a44'];
const SKIN = ['#f0c8a8', '#e0b48f', '#c99273', '#8d5a3c', '#f2cdb0', '#a8704a'];
const HAIR = ['#2b1d14', '#c9a46a', '#8a8a8a', '#4a2a1a', '#1a1a1a', '#6b4a2a', '#d9d4c8', '#a0522d'];
const CARS = ['#c9ccd0', '#1f2226', '#8a1c22', '#e8e8e6', '#3b4e6b', '#6b6f73', '#24452f', '#b0a48a', '#f2f2f0', '#2a2d31', '#5d2f6b', '#c46a1d', '#2f5d8a'];

class Pool {
  constructor(make) {
    this.make = make;
    this.free = [];
  }
  get(arg) {
    const o = this.free.pop() || this.make(arg);
    return o;
  }
  put(o) {
    if (o.visible !== undefined) o.visible = false;
    else if (o.group) o.group.visible = false;
    this.free.push(o);
  }
}

// A cart pushed by a simulated person (wraps the game's cart with its packer).
class SimCart {
  constructor(sim) {
    this.sim = sim;
    this.cart = new Cart(sim.scene);
    this.group = this.cart.group;
    this.x = 0; this.z = 0; this.yaw = 0;
  }
  setPose(x, z, yaw) {
    this.x = x; this.z = z; this.yaw = yaw;
    this.cart.setPose(x, z, yaw);
  }
  addProduct(p) {
    this.cart.add({ p, mesh: this.sim.ps.mesh(p) });
  }
  clearItems() {
    this.cart.contents.clear();
    this.cart.items = [];
    this.cart.packer.reset();
  }
  unpark() {}
}

class SimCage {
  constructor(sim, mesh) {
    this.group = mesh || makeRollCage(0.6 + Math.random() * 0.4);
    sim.scene.add(this.group);
  }
  setPose(x, z, yaw) {
    this.group.position.set(x, 0, z);
    this.group.rotation.y = yaw;
  }
}

class SimTill {
  constructor(sim, lane) {
    this.sim = sim;
    this.lane = lane;
    this.x = (lane.lane[0] + lane.lane[1]) / 2;
    this.seat = { x: lane.cashierX, z: 9.45 };
    this.queue = [];
    this.serving = null;
    this.scanning = false;
    this.timer = 0;
    this.open = false;
    this.closing = false;
    this.cashier = null;
    this.incoming = null;
    this.wantCashier = false;
    this.releaseCashier = false;
    this.belt = [];
    this.openedAt = 0;
  }
  spot(i) {
    return { x: this.x, z: 6.45 - i * 1.15 };
  }
  get load() {
    return this.queue.length + (this.serving ? 1 : 0);
  }
  join(c) {
    this.queue.push(c);
  }
  staffed() {
    this.open = true;
    this.closing = false;
    this.wantCashier = false;
    this.openedAt = this.sim.clock.t;
    this.lane.setOpen(true);
    this.sim.log(`Kasse ${this.lane.n} geöffnet`);
  }
  close() {
    this.closing = true;
  }
  update(dt) {
    const sim = this.sim;
    if (!this.serving && this.queue.length && this.cashier && this.cashier.seated) this.serving = this.queue.shift();
    const c = this.serving;
    if (c && c.atBelt && !this.scanning) {
      this.scanning = true;
      const loose = c.bought.filter((p) => p.loose).length;
      const card = sim.rand() < 0.72;
      this.timer = this.total = c.bought.length * 2.1 + loose * 4 + (card ? 14 : 28) + sim.rand() * 6;
      this.placeBelt(c);
    }
    if (this.scanning) {
      this.timer -= dt;
      const left = Math.ceil((this.belt.length * Math.max(0, this.timer - 18)) / Math.max(1, this.total - 18));
      while (this.belt.length > left) sim.scene.remove(this.belt.pop());
      if (this.timer <= 0) {
        while (this.belt.length) sim.scene.remove(this.belt.pop());
        c.paid = true;
        sim.stats.sale(c);
        this.serving = null;
        this.scanning = false;
      }
    }
    if (this.closing && !this.serving && !this.queue.length && this.cashier && this.cashier.seated) {
      this.releaseCashier = true;
      this.open = false;
      this.closing = false;
      this.lane.setOpen(false);
      sim.log(`Kasse ${this.lane.n} geschlossen`);
    }
  }
  placeBelt(c) {
    const sim = this.sim;
    const n = Math.min(9, c.bought.length);
    for (let i = 0; i < n; i++) {
      const p = c.bought[c.bought.length - 1 - i];
      const m = sim.ps.mesh(p);
      if (p.dim[1] > 0.22) m.rotation.x = Math.PI / 2;
      m.position.set(this.lane.beltX + (Math.random() - 0.5) * 0.1, 0.83 + (p.dim[1] > 0.22 ? p.dim[2] / 2 : 0), 8.75 - i * 0.2);
      sim.scene.add(m);
      this.belt.push(m);
    }
  }
}

class Stock {
  constructor(sim) {
    this.ps = sim.ps;
    this.data = sim.data;
    this.byProduct = new Map();
    for (const s of this.ps.slots) {
      s.cap = s.kind === 'bulk' ? 40 : s.instances.filter((i) => !i.bulk).length;
      s.stock = s.kind === 'bulk' ? 40 : s.stock;
      s.cur = s.kind === 'bulk' ? s.stock : s.instances.filter((i) => !i.bulk && i.visible).length;
      if (!this.byProduct.has(s.p.index)) this.byProduct.set(s.p.index, []);
      this.byProduct.get(s.p.index).push(s);
    }
    this.cap = new Float64Array(this.data.products.length);
    for (const s of this.ps.slots) this.cap[s.p.index] += s.cap;
    this.back = Float64Array.from(this.cap, (c) => Math.round(c * 1.2));
    this.sold = new Float64Array(this.data.products.length);
    this.soldDay = new Float64Array(this.data.products.length);
    this.expect = new Float64Array(this.data.products.length);
  }
  // expected units per day, from the basket model; sets the opening backroom stock
  setDemand(expect) {
    this.expect = expect;
    for (let i = 0; i < expect.length; i++) this.back[i] = Math.max(this.back[i], Math.round(expect[i] * 1.4));
  }
  slotsOf(p) {
    return this.byProduct.get(p.index) || [];
  }
  best(p) {
    let b = null;
    for (const s of this.slotsOf(p)) if (!b || s.cur > b.cur) b = s;
    return b;
  }
  take(s) {
    if (s.cur <= 0) return false;
    if (s.kind === 'bulk') s.stock--;
    else {
      const f = this.ps.frontOfSlot(s);
      if (!f) {
        s.cur = 0;
        return false;
      }
      this.ps.hide(f);
    }
    s.cur--;
    this.sold[s.p.index]++;
    this.soldDay[s.p.index]++;
    return true;
  }
  takeAny(p, prefer) {
    if (prefer && this.take(prefer)) return prefer;
    for (const s of this.slotsOf(p)) if (s !== prefer && this.take(s)) return s;
    return null;
  }
  refillOne(s) {
    const i = s.p.index;
    if (s.cur >= s.cap || this.back[i] <= 0) return false;
    if (s.kind === 'bulk') s.stock++;
    else {
      let cand = null;
      for (const it of s.instances) if (!it.bulk && !it.visible && (!cand || it.order > cand.order)) cand = it;
      if (!cand) {
        s.cur = s.cap;
        return false;
      }
      this.ps.show(cand);
    }
    s.cur++;
    this.back[i]--;
    return true;
  }
  shelfOf(p) {
    let c = 0;
    for (const s of this.slotsOf(p)) c += s.cur;
    return c;
  }
  // The morning delivery: a full shelf plus one and a half days of what sells
  // (yesterday's sales or the forecast, whichever is higher).
  // scale: how today's traffic compares with an ordinary weekday
  deliver(scale = 1) {
    let units = 0;
    for (const p of this.data.products) {
      const i = p.index;
      const demand = Math.max(this.expect[i] * scale, this.soldDay[i]);
      const need = Math.round(this.cap[i] + demand * 1.5 - this.back[i] - this.shelfOf(p));
      if (need > 0) {
        this.back[i] += need;
        units += need;
      }
    }
    return units;
  }
  newDay() {
    this.soldDay.fill(0);
  }
  fill() {
    let c = 0, t = 0;
    for (const s of this.ps.slots) {
      c += s.cur;
      t += s.cap;
    }
    return t ? c / t : 1;
  }
}

class Stats {
  constructor(sim) {
    this.sim = sim;
    this.history = [];
    this.reset();
  }
  reset() {
    const c = this.sim.clock;
    this.today = { day: c.day, weekday: c.weekday, arrivals: 0, customers: 0, served: 0, revenue: 0, items: 0, missing: 0, waitSum: 0, waitN: 0, maxQueue: 0, turnedAway: 0, delivered: 0 };
    this.hourly = new Array(24).fill(0);
    this.missingSeen = new Set();
  }
  sale(c) {
    const t = this.today;
    t.served++;
    t.revenue += c.value;
    t.items += c.bought.length;
    this.hourly[Math.floor(this.sim.clock.hour)]++;
  }
  waited(s) {
    this.today.waitSum += s;
    this.today.waitN++;
  }
  rollover() {
    this.history.push({ ...this.today, fill: this.sim.stock.fill() });
    if (this.history.length > 60) this.history.shift();
    this.reset();
  }
}

export class Simulation {
  constructor({ world, data, game }) {
    this.world = world;
    this.data = data;
    this.game = game;
    this.scene = world.scene;
    this.ps = world.ps;
    this.store = world.store;
    this.exterior = world.exterior;
    this.rand = rng(20261026);
    this.seq = 0;
    // Monday 26 October 2026, 04:50
    this.clock = new SimClock(new Date(2026, 9, 26, 0, 0, 0), 4 * 3600 + 50 * 60);
    this.nav = new Nav();
    this.stock = new Stock(this);
    this.stats = new Stats(this);
    this.events = [];
    this.customers = [];
    this.staff = [];
    this.vehicles = [];
    this.strays = [];
    this.truck = null;
    this.dockHelpers = 0;
    this.collector = null;
    this.cages = [];
    this.policyT = 0;
    this.prevT = this.clock.t;
    this.lighting = new Lighting(world, this.scene);
    this.pools = {
      person: new Pool(() => this.newPerson()),
      staff: { map: new Map(), get: (look) => this.staffMesh(look), put: (m) => (m.visible = false) },
      car: new Pool(() => {
        const g = makeCar(CARS[Math.floor(this.rand() * CARS.length)]);
        this.scene.add(g);
        return g;
      }),
      cart: new Pool(() => new SimCart(this)),
      cage: new Pool(() => new SimCage(this)),
    };
    this.prepareWorld();
    this.access = this.computeAccess();
    this.prepareProducts();
    this.tills = this.store.lanes.map((l) => new SimTill(this, l));
    this.tillOrder = [...this.tills].sort((a, b) => b.lane.n - a.lane.n); // Kasse 3 first
    this.log('Montagmorgen, 04:50. Noch ist alles dunkel.');
  }

  // --- setup -------------------------------------------------------------------
  prepareWorld() {
    const g = this.game;
    // the player's things are not part of the simulation
    g.car.group.visible = false;
    g.checkout.cashier.visible = false;
    for (const n of g.shoppers.list) {
      n.person.visible = n.cart.visible = false;
      for (const c of n.col) c.on = false;
    }
    g.shoppers.list = [];
    for (const m of this.exterior.parkedMeshes) m.visible = false;
    for (const c of this.exterior.parkedColliders) c.on = false;
    this.bays = this.exterior.spaces;
    for (const b of this.bays) b.occupied = false;
    // staff park at the far west end of the second row
    const staffBays = this.bays.filter((b) => b.row === 1).sort((a, b) => a.x - b.x).slice(0, 4);
    for (const b of staffBays) b.reserved = true;
    this.staffBays = staffBays;
    for (const l of this.store.lanes) l.setOpen(false);
    this.corral = this.exterior.corral;
    this.corralReserve = [];
  }

  newPerson() {
    const r = this.rand;
    const pick = (a) => a[Math.floor(r() * a.length)];
    const m = makeLitePerson({ shirt: pick(SHIRTS), pants: pick(PANTS), skin: pick(SKIN), hair: pick(HAIR), tall: 0.9 + r() * 0.18 });
    this.scene.add(m);
    return m;
  }

  staffMesh(look) {
    const key = JSON.stringify(look);
    let m = this.pools.staff.map.get(key);
    if (!m) {
      m = makeLitePerson({ shirt: '#0d5c63', apron: '#083f44', ...look });
      this.scene.add(m);
      this.pools.staff.map.set(key, m);
    }
    return m;
  }

  computeAccess() {
    const map = new Map();
    const nav = this.nav;
    for (const s of this.ps.slots) {
      if (s.p.section === 'kasse') continue;
      const b = s.box;
      const cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2;
      const inst = s.instances.find((i) => !i.bulk) || s.instances[0];
      let fx = 0, fz = 0;
      if (inst && s.fixture !== 'bin') {
        const e = inst.matrix.elements;
        const l = Math.hypot(e[8], e[10]);
        if (l > 0.3) {
          fx = e[8] / l;
          fz = e[10] / l;
        }
      }
      const any = !fx && !fz;
      const loc = nav.locate(cx, cz, (e, px, pz) => {
        if (e.kind !== 'shop') return false;
        if (any) return true;
        const dx = px - cx, dz = pz - cz, d = Math.hypot(dx, dz) || 1;
        return (dx * fx + dz * fz) / d > 0.55;
      });
      if (!loc) continue;
      const dx = cx - loc.x, dz = cz - loc.z, d = Math.hypot(dx, dz) || 1;
      const k = Math.max(0, Math.min(0.55, d - 0.75)) / d;
      const stand = { x: loc.x + dx * k, z: loc.z + dz * k };
      map.set(s, { loc, stand, yaw: Math.atan2(-(cx - stand.x), -(cz - stand.z)) });
    }
    return map;
  }

  prepareProducts() {
    const counts = {};
    for (const p of this.data.products) counts[p.section] = (counts[p.section] || 0) + 1;
    const list = [], w = [];
    let sum = 0;
    for (const p of this.data.products) {
      const sw = SECTION_WEIGHT[p.section];
      if (!sw || !this.stock.slotsOf(p).some((s) => this.access.has(s))) continue;
      sum += sw / Math.pow(counts[p.section], 0.75);
      list.push(p);
      w.push(sum);
    }
    this.buyable = list;
    this.cum = w;
    this.cumTotal = sum;
    this.entrance = this.nav.at(15.85, 8.2);
    // ~960 baskets a day, ~8 items each
    const expect = new Float64Array(this.data.products.length);
    let prev = 0;
    list.forEach((p, i) => {
      expect[p.index] = ((w[i] - prev) / sum) * 960 * 8.2;
      prev = w[i];
    });
    this.stock.setDemand(expect);
  }

  // --- helpers used by people -----------------------------------------------------
  pickProduct() {
    const x = this.rand() * this.cumTotal;
    let lo = 0, hi = this.cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return this.buyable[lo];
  }

  shoppingList() {
    const r = this.rand;
    const g = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    const n = Math.max(1, Math.min(32, Math.round(Math.exp(1.85 + g * 0.6))));
    const picks = new Map();
    for (let i = 0; i < n; i++) {
      const p = this.pickProduct();
      const e = picks.get(p) || { p, qty: 0 };
      e.qty += r() < 0.18 ? 2 : 1;
      picks.set(p, e);
    }
    const items = [];
    for (const e of picks.values()) {
      const slots = this.stock.slotsOf(e.p).filter((s) => this.access.has(s));
      if (!slots.length) continue;
      e.slot = slots.reduce((a, b) => (b.cur > a.cur ? b : a));
      items.push(e);
    }
    // a look at shelves that are not on the list, sometimes ending in an impulse buy
    const keys = [...this.access.keys()];
    const browse = Math.floor(r() * (n > 6 ? 4 : 2.5));
    for (let i = 0; i < browse; i++) {
      const slot = keys[Math.floor(r() * keys.length)];
      if (!items.some((e) => e.p === slot.p)) items.push({ p: slot.p, qty: r() < 0.3 ? 1 : 0, slot, browse: true });
    }
    // walk the shop in a sensible order: always to the nearest next shelf
    const ordered = [];
    let at = this.entrance;
    while (items.length) {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < items.length; i++) {
        const d = this.nav.length(at, this.access.get(items[i].slot).loc);
        if (d < bd) {
          bd = d;
          bi = i;
        }
      }
      const it = items.splice(bi, 1)[0];
      ordered.push(it);
      at = this.access.get(it.slot).loc;
    }
    return ordered;
  }

  missing(p) {
    this.stats.today.missing++;
    if (!this.stats.missingSeen.has(p.id)) {
      this.stats.missingSeen.add(p.id);
      if (this.stats.missingSeen.size <= 6) this.log(`Regal leer: ${p.name}`);
    }
  }

  takeBay() {
    const free = this.bays.filter((b) => !b.occupied && !b.reserved && b.kind !== 'ev' && (b.kind !== 'disabled' || this.rand() < 0.08));
    if (!free.length) return null;
    let best = null, bs = Infinity;
    for (const b of free) {
      const s = Math.hypot(b.x - 15.5, b.z - 17.8) + this.rand() * 14;
      if (s < bs) {
        bs = s;
        best = b;
      }
    }
    best.occupied = true;
    return best;
  }
  freeBay(b) {
    b.occupied = false;
  }

  takeCart() {
    const mesh = this.corral.carts.pop();
    if (mesh) {
      this.corral.stack.remove(mesh);
      this.corralReserve.push(mesh);
    }
    const c = this.pools.cart.get();
    c.group.visible = true;
    return c;
  }
  returnCart(c) {
    if (!c) return;
    c.clearItems();
    this.pools.cart.put(c);
    const mesh = this.corralReserve.pop();
    if (mesh) {
      this.corral.stack.add(mesh);
      this.corral.carts.push(mesh);
    }
  }
  strayCart(c) {
    this.strays.push(c);
  }

  takeCage() {
    const staged = this.cages.pop();
    const cage = staged ? staged.cage : this.pools.cage.get();
    cage.group.visible = true;
    return cage;
  }
  returnCage(c) {
    if (c) this.pools.cage.put(c);
  }

  chooseTill() {
    let best = null;
    for (const t of this.tills) if (t.open && !t.closing && (!best || t.load < best.load)) best = t;
    return best;
  }
  tillNeedingCashier() {
    return this.tillOrder.find((t) => t.wantCashier && !t.incoming) || null;
  }

  plannedRestock(staff) {
    const cands = [];
    // while the shop is closed there is time to top everything up
    const h = this.clock.hour;
    const full = h < OPEN || h >= CLOSE - 1 ? 0.95 : 0.72;
    for (const s of this.access.keys()) {
      if (s.reserved || s.cur >= s.cap * full || this.stock.back[s.p.index] <= 0) continue;
      cands.push(s);
    }
    if (!cands.length) return [];
    cands.sort((a, b) => a.cur / a.cap - b.cur / b.cap);
    const pick = cands.slice(0, 24);
    const route = [];
    let at = this.nav.at(15.85, -8.6);
    while (pick.length && route.length < 8) {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < pick.length; i++) {
        const d = this.nav.length(at, this.access.get(pick[i]).loc);
        if (d < bd) {
          bd = d;
          bi = i;
        }
      }
      const s = pick.splice(bi, 1)[0];
      route.push(s);
      at = this.access.get(s).loc;
    }
    return route;
  }

  randomAccess() {
    const keys = [...this.access.keys()];
    return this.access.get(keys[Math.floor(this.rand() * keys.length)]);
  }

  log(text) {
    this.events.unshift({ t: this.clock.t, text });
    if (this.events.length > 60) this.events.pop();
  }

  // --- the clock ticks ----------------------------------------------------------------
  crossed(hour) {
    const a = this.prevT, b = this.clock.t;
    const at = Math.floor(a / DAY) * DAY + hour * 3600;
    return (a < at && b >= at) || (a < at + DAY && b >= at + DAY);
  }

  step(dt) {
    const c = this.clock;
    this.prevT = c.t;
    c.t += dt;
    if (Math.floor(this.prevT / DAY) !== Math.floor(c.t / DAY)) {
      this.stats.rollover();
      // keep yesterday's sales for the order, but only on the morning of a working day
      if (c.workday) this.stock.newDay();
    }
    if (c.workday) this.schedule(dt);
    else if (this.crossed(12)) this.log('Sonntag: geschlossen. Kein Lieferverkehr.');
    for (const a of this.customers) a.update(dt);
    for (const s of this.staff) s.update(dt);
    for (const v of this.vehicles) v.update(dt);
    if (this.truck) this.updateTruck(dt);
    for (const t of this.tills) t.update(dt);
    this.policyT -= dt;
    if (this.policyT <= 0) {
      this.policyT = 15;
      this.tillPolicy();
    }
    this.cleanup();
  }

  schedule(dt) {
    const c = this.clock;
    const h = c.hour;
    if (this.crossed(5.05)) this.spawnTruck();
    for (const def of SHIFTS) if (this.crossed(def.start) && (!def.days || def.days.includes(c.weekday))) this.startShift(def);
    if (this.crossed(OPEN)) this.log('Türen auf – der Markt ist geöffnet');
    if (this.crossed(CLOSE)) this.log('22:00 – der Markt schließt');
    if (this.crossed(22.75)) this.log('Licht aus');
    // arrivals
    let rate = 0;
    if (h >= 6.8 && h < 7) rate = 30;
    else if (h >= 7 && h < 21.92) rate = (c.weekday === 5 ? SATURDAY : WEEKDAY)[Math.floor(h)] * DAY_FACTOR[c.weekday];
    if (rate) {
      let expect = (rate * dt) / 3600;
      while (expect > 0) {
        if (this.rand() < Math.min(1, expect)) this.customers.push(new Customer(this, { byCar: this.rand() < 0.66 }));
        expect -= 1;
      }
    }
  }

  startShift(def) {
    const s = new Staff(this, { ...def, bay: def.bay === null ? null : this.staffBays[def.bay] });
    this.staff.push(s);
    s.arrive();
  }

  tillPolicy() {
    const c = this.clock;
    const inside = this.customers.some((x) => x.inside);
    const open = this.tills.filter((t) => t.open && !t.closing);
    const waiting = this.tills.reduce((s, t) => s + t.queue.length, 0);
    this.stats.today.maxQueue = Math.max(this.stats.today.maxQueue, waiting);
    const pending = this.tills.some((t) => t.wantCashier);
    const shopping = c.workday && c.hour >= 6.9 && c.hour < CLOSE;
    // shift change at the till: ask for someone to take over
    for (const t of open) if (t.cashier && t.cashier.seated && t.cashier.shiftOver() && !t.wantCashier) t.wantCashier = true;
    // in the rush hours a second till stays open whatever the queue looks like
    const table = c.weekday === 5 ? SATURDAY : WEEKDAY;
    const rush = Math.max(table[Math.floor(c.hour)] || 0, table[Math.floor(c.hour + 0.5) % 24] || 0) * (DAY_FACTOR[c.weekday] || 1);
    const base = shopping && rush >= 88 ? 2 : 1;
    if (shopping || inside || waiting) {
      const next = this.tillOrder.find((t) => !t.open && !t.wantCashier);
      if (!open.length && !pending) this.request(this.tillOrder[0]);
      else if (!pending && next && open.length < base) this.request(next);
      else if (!pending) {
        // open another till when the queues stay long for a minute
        this.busy = waiting / Math.max(1, open.length) > 2.4 ? (this.busy || 0) + 15 : 0;
        if (next && this.busy >= 60) {
          this.request(next);
          this.busy = 0;
        }
      }
      // close the most recently opened extra till after a long quiet spell
      if (open.length > base && waiting <= open.length - 1) {
        this.quiet = (this.quiet || 0) + 15;
        const last = [...open].sort((a, b) => b.openedAt - a.openedAt)[0];
        if (this.quiet > 600 && last && c.t - last.openedAt > 1500) {
          last.close();
          this.quiet = 0;
        }
      } else this.quiet = 0;
    } else {
      for (const t of this.tills) {
        if (t.open && !t.closing) t.close();
        t.wantCashier = false;
      }
    }
  }

  request(till) {
    till.wantCashier = true;
    if (till.lane.n !== 3) this.log(`„Kasse ${till.lane.n} bitte!“`);
  }

  spawnTruck() {
    const t = new Vehicle(this, this.truckMesh || (this.truckMesh = makeTruck()));
    if (!t.group.parent) this.scene.add(t.group);
    t.group.visible = true;
    t.drive(truckIn(), 7.0).drive(truckBack(), 1.3, true);
    t.then(() => {
      t.docked = true;
      t.unloading = true;
      t.unloadT = 0;
      t.cagesLeft = 9;
      this.log('Der LKW steht an der Rampe');
    });
    t.until(() => !t.unloading, 'wird entladen');
    t.then(() => {
      const c = this.clock;
      const sum = (a) => a.reduce((x, y) => x + y, 0);
      const units = this.stock.deliver((sum(c.weekday === 5 ? SATURDAY : WEEKDAY) * (DAY_FACTOR[c.weekday] || 1)) / sum(WEEKDAY));
      this.stats.today.delivered += units;
      this.log(`Lieferung eingeräumt: ${units.toLocaleString('de-DE')} Artikel ins Lager`);
      t.docked = false;
    });
    t.wait(60).drive(truckOut(), 6.5);
    t.then(() => (t.done = true));
    this.truck = t;
    this.log('Der Lieferwagen biegt auf das Gelände');
  }

  updateTruck(dt) {
    const t = this.truck;
    t.update(dt);
    if (t.unloading) {
      t.unloadT += dt;
      // a roll cage comes off the lorry every few minutes
      while (t.cagesLeft > 0 && t.unloadT > (9 - t.cagesLeft + 1) * 200) {
        t.cagesLeft--;
        const cage = new SimCage(this, null);
        const i = this.cages.length;
        cage.target = { x: 20.2 + (i % 3) * 0.95, z: -12.4 + Math.floor(i / 3) * 1.0 };
        cage.from = { x: DOCKED.x - 4.6, z: DOCKED.z };
        cage.k = 0;
        this.cages.push({ cage });
      }
      if (t.cagesLeft === 0 && t.unloadT > 9 * 200 + 120) t.unloading = false;
    }
    if (t.done) {
      t.group.visible = false;
      this.truck = null;
    }
  }

  cleanup() {
    if (this.customers.some((c) => c.done)) this.customers = this.customers.filter((c) => !c.done);
    if (this.staff.some((s) => s.done)) this.staff = this.staff.filter((s) => !s.done);
    if (this.vehicles.some((v) => v.done)) {
      for (const v of this.vehicles) if (v.done) this.pools.car.put(v.group);
      this.vehicles = this.vehicles.filter((v) => !v.done);
    }
  }

  // --- per frame ---------------------------------------------------------------------
  update(realDt, speed) {
    const simDt = realDt * speed;
    const h = speed <= 30 ? 0.2 : speed <= 300 ? 0.5 : speed <= 900 ? 1 : 2;
    this.ps.beginBatch();
    let t = simDt;
    while (t > 1e-6) {
      const d = Math.min(h, t);
      this.step(d);
      t -= d;
    }
    this.ps.endBatch();
    this.sync(realDt, speed);
  }

  // jump ahead without drawing (used by "next morning")
  advance(seconds) {
    this.ps.beginBatch();
    let t = seconds;
    while (t > 1e-6) {
      const d = Math.min(2, t);
      this.step(d);
      t -= d;
    }
    this.ps.endBatch();
  }

  sync(realDt, speed) {
    const anim = Math.min(speed, 3);
    for (const a of this.customers) a.sync(realDt, anim);
    for (const s of this.staff) s.sync(realDt, anim);
    for (const v of this.vehicles) v.sync(realDt * Math.min(speed, 8));
    if (this.truck) {
      this.truck.sync(realDt);
      const lights = this.truck.group.userData.lights;
      lights.material.emissiveIntensity = this.lighting.day < 0.5 ? 2.5 : 0.3;
    }
    for (const c of this.cages) {
      const g = c.cage;
      if (g.target && g.k < 1) {
        g.k = Math.min(1, g.k + realDt * Math.min(speed, 60) * 0.03);
        g.setPose(g.from.x + (g.target.x - g.from.x) * g.k, g.from.z + (g.target.z - g.from.z) * g.k, 0);
      }
    }
    for (const s of this.strays) s.setPose(s.x, s.z, s.yaw);
    this.syncDoors(realDt, speed);
    const h = this.clock.hour;
    const lightsOn = this.clock.workday ? h >= 5.3 && h < 22.75 : false;
    this.lighting.update(h, lightsOn);
    const carGlow = this.lighting.day < 0.5 ? 1.8 : 0.25;
    for (const v of this.vehicles) {
      const l = v.group.userData.lights;
      if (l) l.material.emissiveIntensity = carGlow;
    }
  }

  near(x0, x1, z0, z1, list) {
    for (const a of list) if (a.mesh && a.mesh.visible && a.x > x0 && a.x < x1 && a.z > z0 && a.z < z1) return true;
    return false;
  }

  syncDoors(realDt, speed) {
    const k = 1 - Math.exp(-realDt * 5 * Math.min(speed, 20));
    const ppl = [...this.customers, ...this.staff];
    const doors = this.store.doors;
    const slide = (d, want) => {
      d.open += (want - d.open) * k;
      for (const leaf of d.leaves) leaf.position.x = leaf.userData.closedX + leaf.userData.dir * d.open * (d.w / 2 - 0.08);
    };
    const e = doors.entry, x = doors.exit;
    slide(e, this.clock.open && this.near(e.x - 1.6, e.x + 1.6, e.z - 2.0, e.z + 2.6, this.customers) ? 1 : 0);
    slide(x, this.near(x.x - 1.6, x.x + 1.6, x.z - 2.6, x.z + 0.9, ppl) ? 1 : 0);
    const g = this.store.gate;
    const cx = (GATE.x0 + GATE.x1) / 2;
    const gw = this.near(cx - 1.0, cx + 1.0, GATE.z - 0.6, GATE.z + 1.8, this.customers) ? 1 : 0;
    g.open += (gw - g.open) * k;
    for (const p of g.group.children) p.rotation.y = -p.userData.side * g.open * 1.45;
    const swing = (d, x0, x1, z0, z1) => {
      const want = this.near(x0, x1, z0, z1, this.staff) ? 1 : 0;
      d.open += (want - d.open) * k;
      for (const p of d.leaves) p.rotation.y = p.userData.side * d.open * 1.35;
    };
    swing(this.store.staffDoor, STAFF_DOOR.x - 1.4, STAFF_DOOR.x + 1.4, STAFF_DOOR.z0 - 0.6, STAFF_DOOR.z1 + 0.6);
    swing(this.store.annexDoor, ANNEX.door.x0 - 0.8, ANNEX.door.x1 + 0.8, ANNEX.z1 - 1.4, ANNEX.z1 + 1.4);
    const dock = this.store.dock;
    const dw = this.truck && this.truck.docked ? 1 : 0;
    dock.open += (dw - dock.open) * k;
    dock.door.position.y = ANNEX.dock.h / 2 + dock.open * (ANNEX.dock.h - 0.3);
  }

  // --- for the HUD -----------------------------------------------------------------------
  snapshot() {
    const t = this.stats.today;
    const inside = this.customers.filter((c) => c.inside).length;
    const parked = this.bays.filter((b) => b.occupied).length;
    return {
      ...t,
      inside,
      parked,
      bays: this.bays.length,
      queue: this.tills.reduce((s, x) => s + x.queue.length, 0),
      tillsOpen: this.tills.filter((x) => x.open).length,
      fill: this.stock.fill(),
      avgWait: t.waitN ? t.waitSum / t.waitN : 0,
      staffOn: this.staff.filter((s) => s.onDuty).length,
    };
  }

  // someone interesting to follow
  followable() {
    return [...this.customers.filter((c) => c.mesh.visible || (c.car && c.car.group.visible)), ...this.staff.filter((s) => s.mesh.visible)];
  }
}


// Simulated people: customers doing the whole circle, and the staff who keep
// the shop running (tills, restocking from the backroom, collecting carts).
import { Agent, P, join } from './agent.js';
import { NAV } from './nav.js';
import { Vehicle, arrivePath, parkPath, unparkPath, leavePath } from './vehicles.js';
import { animateWalk, poseSitting, posePushing } from '../world/models.js';

const WALK = 1.25, PUSH = 1.1;
const NAMES = ['Petra', 'Thomas', 'Sandra', 'Michael', 'Fatma', 'Jürgen', 'Lena', 'Kai', 'Monika', 'Ali', 'Sophie', 'Uwe', 'Nadine', 'Dirk', 'Aylin', 'Frank', 'Jana', 'Stefan', 'Olga', 'Tim', 'Heike', 'Marco', 'Svetlana', 'Paul', 'Birgit', 'Emre', 'Lea', 'Holger', 'Katarzyna', 'Jan', 'Renate', 'Luca', 'Miriam', 'Detlef', 'Hannah', 'Yusuf', 'Gisela', 'Felix', 'Anja', 'Bernd'];

// --- shared helpers ----------------------------------------------------------
function navTo(a, to) {
  const sim = a.sim;
  const from = a.loc || sim.nav.at(a.x, a.z);
  const pts = sim.nav.path(from, to);
  a.loc = to;
  return pts;
}

// walk along the network; side offset keeps people off the exact centre line
function go(a, to, label, speed) {
  const pts = navTo(a, to);
  a.walk(pts, speed || (a.cart ? PUSH : WALK), { side: a.side, label });
}

class Person extends Agent {
  constructor(sim, mesh) {
    super(sim);
    this.mesh = mesh;
    this.mesh.visible = false;
    this.side = (sim.rand() - 0.5) * 0.7;
    this.face = null; // yaw while standing at a shelf
    this.cart = null; // pushed cart or cage: { group, setPose }
    this.travelYaw = 0;
    this.seated = false;
    this.cartPose = null;
  }
  show(x, z) {
    this.x = x;
    this.z = z;
    this.mesh.visible = true;
    this.loc = null;
  }
  sync(dt, anim) {
    const m = this.mesh;
    if (!m.visible) return;
    if (this.moving) {
      this.travelYaw = this.yaw;
      this.face = null;
    }
    const yaw = this.face ?? this.yaw;
    m.position.set(this.x, 0, this.z);
    m.rotation.y = yaw;
    if (this.seated) return;
    animateWalk(m, this.moving ? (this.cart ? PUSH : WALK) : 0, dt * anim);
    if (this.cart) {
      const ty = this.travelYaw;
      const want = { x: this.x - Math.sin(ty) * 0.82, z: this.z - Math.cos(ty) * 0.82, yaw: ty };
      this.cart.setPose(want.x, want.z, want.yaw);
    }
  }
  release() {
    this.mesh.visible = false;
    if (this.cart) this.sim.returnCart(this.cart);
    this.cart = null;
    posePushing(this.mesh, false);
    this.sim.pools.person.put(this.mesh);
  }
}

// --- customers ------------------------------------------------------------------
export class Customer extends Person {
  constructor(sim, { byCar }) {
    super(sim, sim.pools.person.get());
    this.id = ++sim.seq;
    this.name = NAMES[Math.floor(sim.rand() * NAMES.length)];
    this.byCar = byCar;
    this.list = sim.shoppingList();
    this.bought = [];
    this.value = 0;
    this.wanted = this.list.filter((e) => !e.browse).length;
    this.wantsCart = byCar || this.wanted > 5;
    this.toWest = sim.rand() < 0.5;
    this.queuedAt = 0;
    sim.stats.today.arrivals++;
    if (byCar) this.arriveByCar();
    else this.arriveOnFoot();
  }

  get label() {
    return this.name;
  }

  arriveByCar() {
    const sim = this.sim;
    const bay = sim.takeBay();
    if (!bay) {
      sim.stats.today.turnedAway++;
      this.done = true;
      this.release();
      return;
    }
    this.bay = bay;
    const car = (this.car = new Vehicle(sim, sim.pools.car.get()));
    car.group.visible = true;
    sim.vehicles.push(car);
    car.drive(arrivePath(sim.rand() < 0.55), 7.5).drive(parkPath(bay), 2.6);
    this.until(() => car.idle, 'fährt auf den Parkplatz')
      .wait(4 + sim.rand() * 6, 'steigt aus')
      .then(() => {
        const s = bay.row === 0 ? -1 : 1;
        this.show(bay.x + s * 1.1, bay.z);
        this.edgeX = bay.x + s * 1.25;
        this.walk([P(this.x, this.z), P(this.edgeX, bay.z), P(this.edgeX, NAV.lotFrontZ)], WALK, { label: 'geht zum Markt' });
        this.loc = sim.nav.at(this.edgeX, NAV.lotFrontZ);
      })
      .then(() => this.toEntrance());
  }

  arriveOnFoot() {
    const sim = this.sim;
    const from = this.toWest ? NAV.streetWest : NAV.streetEast;
    this.show(from.x, from.z);
    this.loc = sim.nav.at(from.x, from.z);
    this.toEntrance();
  }

  toEntrance() {
    const sim = this.sim;
    if (this.wantsCart) {
      go(this, sim.nav.at(NAV.corralMouth.x, NAV.corralMouth.z), 'holt einen Einkaufswagen');
      this.wait(3 + sim.rand() * 3, 'wirft einen Euro ein').then(() => {
        this.cart = sim.takeCart();
        posePushing(this.mesh, true);
      });
    }
    this.then(() => {
      // before 7:00 people wait outside the door
      go(this, sim.nav.at(15.5, 15.1), 'geht zum Eingang');
      this.until(() => sim.clock.open || sim.clock.hour >= 22 || !sim.clock.workday, 'wartet, bis der Markt öffnet');
      this.then(() => {
        if (!sim.clock.open) return this.giveUp();
        this.inside = true;
        sim.stats.today.customers++;
        go(this, sim.nav.at(15.85, 8.2), 'betritt den Markt');
        this.then(() => this.shop());
      });
    });
  }

  giveUp() {
    // shop closed: go back the way they came
    this.inside = false;
    this.leave();
  }

  shop() {
    const sim = this.sim;
    for (const it of this.list) {
      const acc = sim.access.get(it.slot);
      if (!acc) continue;
      this.then(() => {
        // in the shop people stroll, look and compare
        go(this, acc.loc, it.browse ? 'schaut sich um' : 'sucht ' + it.p.name, this.cart ? 0.85 : 0.95);
        this.walk([P(acc.loc.x, acc.loc.z), P(acc.stand.x, acc.stand.z)], 0.7);
        this.then(() => (this.face = acc.yaw));
        if (it.browse) this.wait(6 + sim.rand() * 10, 'guckt sich ' + it.p.name + ' an');
        else if (sim.rand() < 0.2) this.wait(5 + sim.rand() * 12, 'vergleicht Preise');
        if (it.qty) this.wait(3.5 + sim.rand() * 7, (it.browse ? 'greift spontan zu: ' : 'nimmt ') + it.p.name);
        this.then(() => {
          for (let q = 0; q < it.qty; q++) {
            const slot = sim.stock.takeAny(it.p, it.slot);
            if (!slot) {
              sim.missing(it.p);
              break;
            }
            this.bought.push(it.p);
            this.value += it.p.price + (it.p.pfand || 0);
            if (this.cart && this.cart.addProduct && this.bought.length <= 16) this.cart.addProduct(it.p);
          }
          this.loc = acc.loc;
        });
      });
    }
    this.then(() => this.checkout());
  }

  checkout() {
    const sim = this.sim;
    if (!this.bought.length) {
      // nothing found: leave through the till lane without paying
      const till = sim.chooseTill() || sim.tills[sim.tills.length - 1];
      go(this, sim.nav.at(till.x, 11.6), 'geht ohne Einkauf');
      this.then(() => this.exit());
      return;
    }
    let till = null;
    this.until(() => (till = sim.chooseTill()), 'sucht eine offene Kasse');
    this.then(() => {
      till.join(this);
      this.till = till;
      this.queuedAt = sim.clock.t;
      go(this, sim.nav.at(till.x, 5.0), 'stellt sich an');
      // move up as the queue moves
      this._add({
        tick: (a, dt) => {
          if (till.serving === this) return dt;
          const i = till.queue.indexOf(this);
          const spot = till.spot(Math.max(0, i));
          const dx = spot.x - this.x, dz = spot.z - this.z;
          const d = Math.hypot(dx, dz);
          const step = dt * 0.9;
          this.activity = 'wartet an Kasse ' + till.lane.n;
          if (d > 0.03) {
            this.yaw = Math.atan2(-dx, -dz);
            const k = Math.min(1, step / d);
            this.x += dx * k;
            this.z += dz * k;
            this.moving = d > 0.15;
          } else this.moving = false;
          return -1;
        },
      });
      this.then(() => {
        sim.stats.waited(sim.clock.t - this.queuedAt);
        this.loc = null;
      });
      this.walk([P(this.x, this.z), P(till.x, 7.9)], 0.9, { label: 'legt alles aufs Band' });
      this.then(() => (this.atBelt = true));
      this.until(() => this.paid, 'bezahlt an Kasse ' + till.lane.n);
      this.walk([P(till.x, 7.9), P(till.x, 9.9)], 0.9, { label: 'packt ein' });
      this.wait(4 + this.bought.length * 0.6, 'packt ein');
      this.then(() => {
        this.loc = sim.nav.at(till.x, 9.9);
        go(this, sim.nav.at(till.x, 11.6), 'geht zum Ausgang');
        this.then(() => this.exit());
      });
    });
  }

  exit() {
    const sim = this.sim;
    go(this, sim.nav.at(4.5, 13.9), 'geht hinaus');
    this.then(() => {
      this.inside = false;
      this.leave();
    });
  }

  leave() {
    const sim = this.sim;
    if (this.byCar) {
      const bay = this.bay;
      const trunk = bay.row === 0 ? P(bay.x, bay.z + 2.9) : P(bay.x, bay.z - 2.9);
      go(this, sim.nav.at(this.edgeX, NAV.lotFrontZ), 'geht zum Auto');
      this.then(() => {
        this.walk([P(this.edgeX, NAV.lotFrontZ), P(this.edgeX, trunk.z), trunk], this.cart ? PUSH : WALK, { label: 'geht zum Auto' });
        this.then(() => {
          this.face = bay.row === 0 ? 0 : Math.PI;
          this.car.lidTarget = 1;
        });
        this.wait(5 + this.bought.length * 1.1, 'lädt den Kofferraum');
        this.then(() => {
          this.car.lidTarget = 0;
          if (this.cart) this.cart.clearItems();
          this.walk([trunk, P(this.edgeX, trunk.z), P(this.edgeX, NAV.lotFrontZ)], this.cart ? PUSH : WALK);
          this.loc = sim.nav.at(this.edgeX, NAV.lotFrontZ);
          this.then(() => this.returnCart());
          this.then(() => {
            go(this, sim.nav.at(this.edgeX, NAV.lotFrontZ), 'geht zum Auto');
            this.walk([P(this.edgeX, NAV.lotFrontZ), P(this.edgeX, bay.z), P(bay.x + (bay.row === 0 ? -1.1 : 1.1), bay.z)], WALK);
            this.wait(3, 'steigt ein');
            this.then(() => this.driveOff());
          });
        });
      });
    } else {
      if (this.cart) this.then(() => this.cart.clearItems());
      this.then(() => this.returnCart());
      this.then(() => {
        const to = this.toWest ? NAV.streetWest : NAV.streetEast;
        go(this, sim.nav.at(to.x, to.z), 'geht nach Hause');
        this.then(() => this.finish());
      });
    }
  }

  returnCart() {
    const sim = this.sim;
    if (!this.cart) return;
    // a few people leave the cart standing in the car park
    if (this.byCar && sim.rand() < 0.04) {
      const cart = this.cart;
      this.cart = null;
      posePushing(this.mesh, false);
      sim.strayCart(cart);
      return;
    }
    go(this, sim.nav.at(NAV.corralMouth.x, NAV.corralMouth.z), 'bringt den Wagen zurück');
    this.wait(3 + sim.rand() * 2, 'holt den Euro zurück');
    this.then(() => {
      sim.returnCart(this.cart);
      this.cart = null;
      posePushing(this.mesh, false);
      this.loc = sim.nav.at(NAV.corralMouth.x, NAV.corralMouth.z);
    });
  }

  driveOff() {
    const sim = this.sim;
    this.mesh.visible = false;
    const car = this.car;
    car.drive(unparkPath(this.bay), 1.4, true).drive(leavePath(this.bay, sim.rand() < 0.5), 6.5);
    car.then(() => {
      sim.freeBay(this.bay);
      car.done = true;
    });
    this.until(() => car.done, 'fährt nach Hause');
    this.then(() => this.finish());
  }

  finish() {
    this.done = true;
    this.release();
  }
}

// --- staff ----------------------------------------------------------------------
export class Staff extends Person {
  constructor(sim, def) {
    super(sim, sim.pools.staff.get(def.look));
    this.name = def.name;
    this.def = def;
    this.role = null;
    this.onDuty = false;
    this.mesh.visible = false;
  }

  get label() {
    return this.name;
  }

  // called by the sim when the shift starts
  arrive() {
    const sim = this.sim;
    const def = this.def;
    if (def.bay) {
      const bay = def.bay;
      const car = (this.car = new Vehicle(sim, sim.pools.car.get()));
      car.group.visible = true;
      sim.vehicles.push(car);
      car.drive(arrivePath(true), 7.5).drive(parkPath(bay), 2.6);
      this.until(() => car.idle, 'fährt zur Arbeit');
      this.wait(5, 'steigt aus');
      this.then(() => {
        this.show(bay.x + 1.1, bay.z);
        this.edgeX = bay.x + 1.25;
        this.walk([P(this.x, this.z), P(this.edgeX, bay.z), P(this.edgeX, NAV.lotFrontZ)], WALK, { label: 'kommt zur Schicht' });
        this.loc = sim.nav.at(this.edgeX, NAV.lotFrontZ);
      });
    } else {
      this.then(() => {
        this.show(NAV.streetWest.x, NAV.streetWest.z);
        this.loc = sim.nav.at(NAV.streetWest.x, NAV.streetWest.z);
      });
    }
    this.then(() => {
      go(this, sim.nav.at(NAV.annex.x, NAV.annex.z), 'kommt zur Schicht');
      this.wait(150, 'zieht sich um');
      this.then(() => {
        this.onDuty = true;
        sim.log(`${this.name} beginnt die Schicht`);
      });
    });
  }

  // pick the next job when idle
  next() {
    const sim = this.sim;
    const t = sim.clock.t;
    if (this.shiftOver() && !this.role) return this.goHome();
    // a till that needs a cashier
    const till = sim.tillNeedingCashier(this);
    if (till) return this.toTill(till);
    if (sim.truck && sim.truck.unloading && sim.dockHelpers < 1) return this.helpDock();
    if (sim.strays.length >= 2 && !sim.collector && sim.clock.hour > 8) return this.collectCarts();
    const trip = sim.plannedRestock(this);
    if (trip.length) return this.restock(trip);
    // nothing urgent: tidy a shelf for a bit
    const acc = sim.randomAccess();
    if (acc) {
      go(this, acc.loc, 'verräumt Ware');
      this.walk([P(acc.loc.x, acc.loc.z), P(acc.stand.x, acc.stand.z)], 0.8);
      this.then(() => (this.face = acc.yaw));
      this.wait(40 + sim.rand() * 60, 'zieht die Ware nach vorne');
    } else this.wait(30, 'macht Pause');
    void t;
  }

  shiftOver() {
    const h = this.sim.clock.hour;
    return h >= this.def.end || h < this.def.start - 1;
  }

  toTill(till) {
    const sim = this.sim;
    this.role = 'till';
    till.incoming = this;
    go(this, sim.nav.at(till.x, 11.6), 'geht an Kasse ' + till.lane.n);
    this.walk([P(till.x, 11.6), P(till.seat.x, 11.0), P(till.seat.x, till.seat.z)], WALK);
    this.then(() => {
      this.seated = true;
      this.face = -Math.PI / 2;
      poseSitting(this.mesh, true);
      // taking over from a colleague whose shift ends
      if (till.cashier && till.cashier !== this) till.cashier.handover = true;
      till.cashier = this;
      till.incoming = null;
      if (!till.open) till.staffed();
      else till.wantCashier = false;
    });
    this.until(() => (till.releaseCashier && till.cashier === this) || this.handover, 'sitzt an Kasse ' + till.lane.n);
    this.then(() => {
      this.seated = false;
      poseSitting(this.mesh, false);
      if (this.handover) this.handover = false;
      else {
        till.cashier = null;
        till.releaseCashier = false;
      }
      this.role = null;
      this.walk([P(till.seat.x, till.seat.z), P(till.seat.x, 11.0), P(till.x, 11.6)], WALK);
      this.loc = sim.nav.at(till.x, 11.6);
    });
  }

  helpDock() {
    const sim = this.sim;
    this.role = 'dock';
    sim.dockHelpers++;
    go(this, sim.nav.at(NAV.dockIn.x, NAV.dockIn.z), 'nimmt die Lieferung an');
    this.then(() => (this.face = -Math.PI / 2));
    this.until(() => !sim.truck || !sim.truck.unloading, 'nimmt die Lieferung an');
    this.then(() => {
      sim.dockHelpers--;
      this.role = null;
    });
  }

  restock(slots) {
    const sim = this.sim;
    this.role = 'restock';
    for (const s of slots) s.reserved = this;
    go(this, sim.nav.at(NAV.staging.x, NAV.staging.z), 'holt einen Rollcontainer');
    this.wait(8, 'holt einen Rollcontainer');
    this.then(() => {
      this.cart = sim.takeCage();
    });
    for (const s of slots) {
      const acc = sim.access.get(s);
      this.then(() => {
        go(this, acc.loc, 'füllt auf: ' + s.p.name);
        this.walk([P(acc.loc.x, acc.loc.z), P(acc.stand.x, acc.stand.z)], 0.8);
        this.then(() => (this.face = acc.yaw));
        // one pack every 1.4 s until the slot is full or the backroom is empty
        this._add({
          acc: 0,
          init: (a) => (a.activity = 'füllt auf: ' + s.p.name),
          tick(a, dt) {
            this.acc += dt;
            while (this.acc >= 1.4) {
              this.acc -= 1.4;
              if (!sim.stock.refillOne(s)) return this.acc;
            }
            return -1;
          },
        });
        this.then(() => {
          s.reserved = null;
          this.loc = acc.loc;
        });
      });
    }
    this.then(() => {
      go(this, sim.nav.at(NAV.staging.x, NAV.staging.z), 'bringt den Rollcontainer zurück');
      this.wait(6, 'stellt den Rollcontainer ab');
      this.then(() => {
        sim.returnCage(this.cart);
        this.cart = null;
        this.role = null;
      });
    });
  }

  collectCarts() {
    const sim = this.sim;
    this.role = 'carts';
    sim.collector = this;
    go(this, sim.nav.at(19.0, NAV.sidewalkZ), 'sammelt Einkaufswagen ein');
    const carts = sim.strays.splice(0, 3);
    for (const cart of carts) {
      this.then(() => {
        this.walk([P(this.x, this.z), P(cart.x + Math.sin(cart.yaw) * 0.82, cart.z + Math.cos(cart.yaw) * 0.82)], WALK, { label: 'sammelt Einkaufswagen ein' });
        this.then(() => {
          cart.unpark();
          this.cart = cart;
          this.travelYaw = this.yaw;
          this.loc = null;
        });
        this.then(() => {
          go(this, sim.nav.at(NAV.corralMouth.x, NAV.corralMouth.z), 'schiebt Wagen zurück');
          this.then(() => {
            sim.returnCart(this.cart);
            this.cart = null;
          });
        });
      });
    }
    this.then(() => {
      sim.collector = null;
      this.role = null;
      go(this, sim.nav.at(NAV.annex.x, NAV.annex.z), 'geht zurück ins Lager');
    });
  }

  goHome() {
    const sim = this.sim;
    this.role = 'home';
    this.onDuty = false;
    go(this, sim.nav.at(NAV.annex.x, NAV.annex.z), 'Feierabend');
    this.wait(120, 'zieht sich um');
    this.then(() => sim.log(`${this.name} hat Feierabend`));
    if (this.def.bay) {
      this.then(() => {
        go(this, sim.nav.at(this.edgeX, NAV.lotFrontZ), 'geht zum Auto');
        this.walk([P(this.edgeX, NAV.lotFrontZ), P(this.edgeX, this.def.bay.z), P(this.def.bay.x + 1.1, this.def.bay.z)], WALK);
        this.wait(4, 'steigt ein');
        this.then(() => {
          this.mesh.visible = false;
          const car = this.car;
          car.drive(unparkPath(this.def.bay), 1.4, true).drive(leavePath(this.def.bay, true), 6.5);
          car.then(() => (car.done = true));
        });
        this.until(() => this.car.done, 'fährt nach Hause');
        this.then(() => this.offShift());
      });
    } else {
      this.then(() => {
        go(this, sim.nav.at(NAV.streetWest.x, NAV.streetWest.z), 'geht nach Hause');
        this.then(() => this.offShift());
      });
    }
  }

  offShift() {
    this.mesh.visible = false;
    this.sim.pools.staff.put(this.mesh);
    this.role = 'off';
    this.done = true;
    this.loc = null;
  }

  update(dt) {
    if (this.role !== 'off' && this.onDuty && this.idle) this.next();
    super.update(dt);
  }
}

// The open till (Kasse 3): you put things on the belt, the cashier scans them
// at discounter speed into the bagging bay, and you pack them back into the cart.
import * as THREE from '../../vendor/three.module.min.js';
import { CHECKOUT } from '../world/layout.js';
import { makePerson } from '../world/models.js';
import { euro } from '../util.js';

const C = CHECKOUT;
const BELT_Y = C.counterH + 0.006;
const BAY_Y = 0.71;

export class Checkout {
  constructor(game, lane) {
    this.game = game;
    this.lane = lane;
    this.belt = [];
    this.bay = [];
    this.scanned = []; // items scanned in this transaction
    this.lines = [];
    this.total = 0;
    this.pfandBonApplied = 0;
    this.state = 'idle'; // idle | scanning | total | paid
    this.busy = 0;
    this.current = null;
    this.lastLine = null;
    this.idCheckDone = false;
    this.cashier = makePerson({ shirt: '#0d5c63', pants: '#22262c', hair: '#6b3a1f', skin: '#d8a07a', sitting: true, logo: true });
    this.cashier.position.set(lane.cashierX, 0.02, 9.45);
    this.cashier.rotation.y = -Math.PI / 2;
    game.scene.add(this.cashier);
    // a Warentrenner lying at the start of the belt
    const div = new THREE.Mesh(new THREE.BoxGeometry(lane.beltW - 0.04, 0.035, 0.045), new THREE.MeshStandardMaterial({ color: '#0d5c63', roughness: 0.5 }));
    div.position.set(lane.beltX, BELT_Y + 0.018, C.beltZ0 - 0.02);
    game.scene.add(div);
    this.divider = div;
    this.speech = null;
  }

  // the player stands at the belt with goods
  atBelt(px, pz) {
    const [l0, l1] = this.lane.lane;
    return px > l0 - 0.2 && px < l1 + 0.3 && pz > 5.6 && pz < 9.2;
  }
  atBay(px, pz) {
    const [l0, l1] = this.lane.lane;
    return px > l0 - 0.2 && px < l1 + 0.3 && pz > 8.7 && pz < 11.6;
  }

  beltRoom() {
    let used = 0;
    for (const b of this.belt) used += b.len + 0.03;
    return C.beltZ1 - C.beltZ0 - 0.06 - used;
  }

  // put one item on the belt; false if there is no room
  load(item, fromPos) {
    const len = footprintLen(item.p);
    if (this.beltRoom() < len) return false;
    if (this.state === 'idle' || this.state === 'paid') this.begin();
    const mesh = item.mesh;
    mesh.matrixAutoUpdate = true;
    mesh.matrix.identity();
    const o = orientOnBelt(mesh, item.p);
    const x = this.lane.beltX + (Math.random() - 0.5) * 0.12;
    const z = C.beltZ0 + len / 2 + 0.02;
    mesh.position.set(x, BELT_Y + o.lift, z + o.zOff);
    this.game.scene.add(mesh);
    if (fromPos) this.game.fly(mesh, fromPos, mesh.position.clone(), 0.25);
    this.belt.push({ item, mesh, len, z, ...o });
    return true;
  }

  begin() {
    if (this.state === 'paid') this.reset();
    this.state = 'scanning';
    this.say('Hallo!');
    // a Pfandbon gets scanned first
    if (this.game.state.pfandBon > 0) {
      const v = this.game.state.pfandBon;
      this.game.state.pfandBon = 0;
      this.pfandBonApplied = v;
      this.addLine({ name: 'Leergutbon', qty: 1, unit: -v, total: -v, vat: 19, kind: 'bon' });
    }
  }

  reset() {
    this.scanned = [];
    this.lines = [];
    this.total = 0;
    this.pfandBonApplied = 0;
    this.state = 'idle';
    this.lastLine = null;
  }

  say(text) {
    this.game.hud.toast('Kassiererin: „' + text + '“', 'speech');
  }

  update(dt) {
    // belt: items creep towards the scanner, each behind the one in front
    let front = C.beltZ1;
    let moving = false;
    for (const b of this.belt) {
      const target = front - b.len / 2;
      if (b.z < target - 0.002) {
        b.z = Math.min(target, b.z + 0.32 * dt);
        moving = true;
      }
      front = b.z - b.len / 2 - 0.03;
      if (!b.mesh.userData.flying) b.mesh.position.z = b.z + b.zOff;
    }
    if (moving) this.lane.belt.material.map.offset.y -= dt * 0.32 * 1.5;
    // cashier: scan the front item
    if (this.busy > 0) {
      this.busy -= dt;
      const it = this.current;
      if (it) {
        const k = 1 - Math.max(0, this.busy) / it.dur;
        // lift across the scanner, then into the bay
        const from = it.from, to = it.to;
        it.mesh.position.lerpVectors(from, to, k);
        it.mesh.position.y += Math.sin(k * Math.PI) * 0.12;
        this.cashier.userData.armR.rotation.x = 0.9 + Math.sin(k * Math.PI) * 0.6;
      }
      if (this.busy <= 0 && it) this.finishScan(it);
    } else if (this.state === 'scanning' && this.belt.length) {
      const b = this.belt[0];
      const atEnd = b.z >= C.beltZ1 - b.len / 2 - 0.01;
      if (atEnd && this.bay.length < 14) {
        this.belt.shift();
        const loose = !!b.item.p.loose;
        const dur = (loose ? 1.2 : 0.45) + Math.random() * 0.35;
        const slot = this.baySlot(this.bay.length).add(new THREE.Vector3(0, b.lift, b.zOff));
        this.current = { ...b, dur, from: b.mesh.position.clone(), to: slot };
        this.busy = dur;
      } else if (atEnd && this.bay.length >= 14 && !this.warnedFull) {
        this.warnedFull = true;
        this.say('Die Ablage ist voll – bitte einpacken!');
      }
    } else if (this.state === 'scanning' && !this.belt.length && this.busy <= 0 && this.scanned.length) {
      if (!this.game.hasUnpaidOnPerson()) this.announceTotal();
    }
  }

  baySlot(i) {
    const [c0, c1] = this.lane.counter;
    const col = i % 2, row = Math.floor(i / 2) % 4, layer = Math.floor(i / 8);
    return new THREE.Vector3(c0 + 0.2 + col * 0.38, BAY_Y + layer * 0.09, C.bayZ0 + 0.13 + row * 0.24);
  }

  finishScan(it) {
    this.current = null;
    this.game.audio.beep();
    const item = it.item;
    this.scanned.push(item);
    item.scanned = true;
    it.mesh.position.copy(it.to);
    this.bay.push({ item, mesh: it.mesh });
    this.warnedFull = false;
    const p = item.p;
    if (p.loose) {
      this.addLine({ name: p.bon, qty: 1, weight: item.weight, unit: p.price, total: item.price, vat: p.vat, sku: p.id, gtin: p.gtin, plu: p.plu, kind: 'loose' });
    } else {
      this.addLine({ name: p.bon, qty: 1, unit: p.price, total: p.price, vat: p.vat, sku: p.id, gtin: p.gtin, plu: p.plu, was: p.was, kind: 'item' });
    }
    if (p.pfand) this.addLine({ name: 'Pfand' + (p.pfandText ? ' ' + p.pfandText : ''), qty: 1, unit: p.pfand, total: p.pfand, vat: p.vat, sku: p.id + ':pfand', kind: 'pfand' });
    if (p.tags.includes('alkohol') && !this.idCheckDone) {
      this.idCheckDone = true;
      if (Math.random() < 0.5) this.say('Sie sehen ja jung aus … Ausweis? – Danke, passt.');
    }
  }

  addLine(line) {
    // same SKU scanned again: count it up (like hitting "x2" on the till)
    const last = this.lines[this.lines.length - 1];
    const prev = line.kind === 'item' || line.kind === 'pfand' ? this.lines.find((l) => l.sku === line.sku) : null;
    if (prev) {
      prev.qty += 1;
      prev.total += line.total;
    } else this.lines.push(line);
    this.total += line.total;
    this.lastLine = line.kind === 'pfand' && last ? last : line;
    this.lastLine.flash = performance.now();
  }

  announceTotal() {
    this.state = 'total';
    this.say(`Das macht ${euro(this.total)} €. Mit Karte?`);
    this.game.audio.terminal();
  }

  // take one item from the bay (nearest first)
  takeFromBay() {
    return this.bay.shift() || null;
  }

  savings() {
    let s = 0;
    for (const l of this.lines) if (l.was && l.kind === 'item') s += (l.was - l.unit) * l.qty;
    return s;
  }

  vatTable() {
    const rows = {};
    for (const l of this.lines) {
      const key = l.vat === 7 ? 'A' : 'B';
      rows[key] = rows[key] || { code: key, rate: l.vat, gross: 0 };
      rows[key].gross += l.total;
    }
    return Object.values(rows)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((r) => {
        const net = Math.round(r.gross / (1 + r.rate / 100));
        return { ...r, net, vat: r.gross - net };
      });
  }

  complete(payment) {
    this.state = 'paid';
    for (const it of this.scanned) it.paid = true;
    const now = this.game.clockDate();
    const receipt = {
      lines: this.lines.map((l) => ({ ...l })),
      total: this.total,
      vat: this.vatTable(),
      payment,
      savings: this.savings(),
      date: now,
      kasse: this.lane.n,
      bon: 4000 + Math.floor(Math.random() * 999),
      tse: Math.floor(1e6 + Math.random() * 8e6),
      tseStart: new Date(now.getTime() - 60000 - this.scanned.length * 2500),
    };
    this.say(payment.method === 'card' ? 'Zahlung erfolgt. Danke, schönen Tag noch!' : `${euro(payment.change)} € zurück. Danke, schönen Tag noch!`);
    return receipt;
  }
}

// length an item takes up along the belt
function footprintLen(p) {
  const [w, h, d] = p.dim;
  return h > 0.22 ? h : Math.max(Math.min(w, d), 0.05);
}

// pose on the belt; returns the offsets from the item's footprint centre
function orientOnBelt(mesh, p) {
  const [w, h, d] = p.dim;
  mesh.rotation.set(0, 0, 0);
  if (h > 0.22) {
    // tall things lie down along the belt, top towards the scanner
    mesh.rotation.set(Math.PI / 2, 0, 0);
    return { lift: d / 2, zOff: -h / 2 };
  }
  if (w > d) mesh.rotation.y = Math.PI / 2;
  return { lift: 0, zOff: 0 };
}

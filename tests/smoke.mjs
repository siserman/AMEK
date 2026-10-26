// End-to-end run through the whole trip in headless Chromium.
//   node tests/smoke.mjs [--shots dir]
// Serves the repo, starts the game, then plays it through the game's own
// actions (aiming at shelves, using the till, paying) and checks the receipt.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shotsDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = p.endsWith('/') ? path.join(p, 'index.html') : p;
  fs.readFile(file, (err, buf) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(buf);
  });
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html?test&lowres`;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
let failed = 0;
const check = (ok, msg) => {
  console.log((ok ? '  ok   ' : '  FAIL ') + msg);
  if (!ok) failed++;
};
const shot = async (name) => {
  if (!shotsDir) return;
  await page.evaluate(() => AMEK.game.render());
  await page.screenshot({ path: path.join(shotsDir, name + '.png'), timeout: 180000 });
};
const run = (fn, arg) => page.evaluate(fn, arg);

await page.goto(url);
await page.waitForFunction(() => window.AMEK && !document.getElementById('go').disabled, null, { timeout: 180000 });
console.log('loaded');
await shot('00-start');
await page.click('#go');
await page.evaluate(() => (AMEK.hold = true));
await page.waitForTimeout(300);
check(await run(() => AMEK.game.mode === 'drive'), 'starts in the car');
await shot('01-drive');

// helper inside the page: simulate frames without waiting for rendering
await run(() => {
  const g = AMEK.game;
  window.step = (sec, keys = []) => {
    for (const k of keys) g.input.keys.add(k);
    for (let t = 0; t < sec; t += 0.05) g.update(0.05);
    for (const k of keys) g.input.keys.delete(k);
  };
  window.inter = (key) => g.interactables.find((i) => i.key === key);
});

// --- drive along the street and into the car park
const drove = await run(() => {
  const g = AMEK.game;
  step(1.5, ['KeyW']);
  return g.car.x;
});
check(drove > -2, 'car drives forward on the street (x=' + drove.toFixed(1) + ')');
const parked = await run(() => {
  const g = AMEK.game;
  const free = g.world.exterior.spaces.filter((s) => !s.occupied && s.row === 0 && !s.kind).sort((a, b) => b.x - a.x)[0];
  g.car.place(free.x, free.z + 0.2, 0);
  step(0.2);
  const sp = g.parkedSpace();
  g.exitCar();
  return { space: !!sp, mode: g.mode };
});
check(parked.space && parked.mode === 'walk', 'parks in a free space and gets out');
await shot('02-parked');

// --- trunk: leergut, then cart
const cart = await run(() => {
  const g = AMEK.game;
  const C = g.world.exterior.corral;
  g.teleport(C.cx, C.z1 + 1.0, 0, 0);
  step(0.1);
  g.updateFocus();
  const label = g.focus?.it?.label();
  g.use();
  return { label, cart: !!g.cart, coins: g.state.wallet[100] };
});
check(cart.cart && cart.coins === 1, `takes a cart for 1 € ("${cart.label}")`);
const lg = await run(() => {
  const g = AMEK.game;
  const t = g.car.trunk();
  const yaw = g.car.heading + Math.PI;
  g.teleport(t.x + Math.sin(yaw) * 1.0, t.z + Math.cos(yaw) * 1.0, yaw, -0.3);
  step(0.1);
  g.updateFocus();
  const label = g.focus?.it?.label();
  g.use();
  return { label, inCart: g.cart.items.includes(g.leergut) };
});
check(lg.inCart, `puts the Leergut in the cart ("${lg.label}")`);
await shot('03-cart');

// --- walk in through the doors and the gate
const entered = await run(() => {
  const g = AMEK.game;
  g.teleport(15.5, 15.6, 0, 0);
  step(4.0, ['KeyW']);
  return { z: g.player.z, entered: !!g.state.flags.entered, door: g.store.doors.entry.open };
});
check(entered.z < 11, 'walks through the entrance (z=' + entered.z.toFixed(2) + ')');
// the gate swings open only one way
const blocked = await run(() => {
  const g = AMEK.game;
  step(2.5, ['KeyW']);
  const inside = g.player.z;
  g.player.yaw = Math.PI;
  g.player.syncCart();
  step(4.0, ['KeyW']);
  return { inside, back: g.player.z, entered: !!g.state.flags.entered };
});
check(blocked.entered && blocked.back < 10.8, 'entry gate does not let you out again (z=' + blocked.back.toFixed(2) + ')');

// --- Pfandautomat (in the vestibule: teleport there as if we'd gone there first)
const pfand = await run(() => {
  const g = AMEK.game;
  g.teleport(16.2, 12.0, -Math.PI / 2, -0.2);
  step(0.1);
  g.updateFocus();
  const label = g.focus?.it?.label();
  g.use();
  step(6.5);
  return { label, bon: g.state.pfandBon };
});
check(pfand.bon === 200, `Pfandautomat prints a 2,00 € Bon ("${pfand.label}")`);
await run(() => AMEK.game.teleport(15.5, 9.5, 0, 0));

// --- shop the list by aiming at shelves
const shopped = await run(() => {
  const g = AMEK.game;
  const ps = g.ps;
  const log = [];
  const takeOne = (id) => {
    const slot = ps.slots.find((s) => s.p.id === id && s.instances.some((i) => i.visible));
    if (!slot) return log.push('no slot ' + id);
    // stand in front of the front-most pack (its local +z is the side facing the aisle)
    const inst = ps.frontOfSlot(slot);
    const e = inst.matrix.elements;
    const b = inst.box;
    const cx = (b[0] + b[3]) / 2, cy = (b[1] + b[4]) / 2, cz = (b[2] + b[5]) / 2;
    let best = null;
    for (const dist of [1.1, 0.8, 1.4]) {
      const x = cx + e[8] * dist, z = cz + e[10] * dist;
      if (g.col.blocked([{ x, z, r: 0.3 }], (c) => c.tag === 'npc' || g.walkIgnore(c))) continue;
      g.teleport(x, z);
      const f = g.aimAt(cx, cy, cz);
      if (f && f.kind === 'product' && f.hit.slot.p.id === id) { best = f; break; }
    }
    if (!best) return log.push('cannot aim at ' + id);
    const n = g.cart.items.length;
    g.use();
    if (g.cart.items.length !== n + 1) log.push('not taken ' + id);
  };
  for (const it of g.state.list.items) for (let k = 0; k < it.count; k++) takeOne([...it.ids][0]);
  takeOne('bananen');
  takeOne('cola');
  takeOne('weizenbroetchen');
  return { log, n: g.cart.items.length, progress: g.listProgress() };
});
check(shopped.log.length === 0, 'picks every list item off the shelf ' + (shopped.log.length ? shopped.log.join(', ') : ''));
check(shopped.progress.every((p) => p.have >= p.need), 'shopping list complete');
await run(() => {
  const g = AMEK.game;
  const slot = g.ps.slots.find((s) => s.p.id === 'cola');
  const b = slot.box;
  g.teleport((b[0] + b[3]) / 2 + 1.25, (b[2] + b[5]) / 2);
  g.aimAt((b[0] + b[3]) / 2, b[1] + 0.06, (b[2] + b[5]) / 2);
});
await shot('04-shelf');
// put the cola back
const back = await run(() => {
  const g = AMEK.game;
  const n = g.cart.items.length;
  g.putBack();
  return n - g.cart.items.length;
});
check(back === 1, 'Q puts an item back on its shelf');

// --- till
const till = await run(() => {
  const g = AMEK.game;
  const lane = g.checkout.lane;
  g.teleport((lane.lane[0] + lane.lane[1]) / 2, 6.3, Math.PI, -0.3);
  step(0.1);
  let guard = 0;
  while (g.hasUnpaidOnPerson() && guard++ < 200) {
    g.updateFocus();
    if (g.focus?.it?.key === 'belt') g.use();
    step(0.2);
    if (guard % 10 === 0) step(1.0);
  }
  // follow the belt and pack as the cashier scans
  g.teleport((lane.lane[0] + lane.lane[1]) / 2 - 0.1, 9.0, Math.PI, -0.4);
  for (let i = 0; i < 400 && g.checkout.state !== 'total'; i++) {
    step(0.2);
    g.updateFocus();
    if (g.focus?.it?.key === 'bay') g.use();
  }
  // look at the bay, not the card terminal, while packing
  for (let i = 0; i < 60 && g.checkout.bay.length; i++) {
    g.aimAt(lane.lane[0] + 0.45, 0.8, 10.0);
    if (g.focus?.it?.key === 'bay') g.use(); else step(0.1);
  }
  return { state: g.checkout.state, total: g.checkout.total, lines: g.checkout.lines.length, bay: g.checkout.bay.length, inCart: g.cart.items.length };
});
check(till.state === 'total', `cashier scanned everything (${till.lines} lines, total ${(till.total / 100).toFixed(2)} €)`);
check(till.bay === 0, 'packed everything from the bay back into the cart');
await shot('05-till');

// receipt maths: lines add up and match the items
const pay = await run(() => {
  const g = AMEK.game;
  const items = g.cart.items.filter((i) => !i.p.special);
  const expect = items.reduce((s, i) => s + i.price + (i.p.pfand || 0), 0) - 200;
  const linesSum = g.checkout.lines.reduce((s, l) => s + l.total, 0);
  g.teleport(g.checkout.lane.terminal.x + 0.6, 9.3, Math.PI / 2, -0.2);
  g.updateFocus();
  const label = g.focus?.it?.label();
  g.use();
  return { expect, total: g.checkout.total, linesSum, label, open: g.ui.openId };
});
check(pay.total === pay.expect && pay.linesSum === pay.total, `receipt total ${(pay.total / 100).toFixed(2)} € = items + Pfand − Leergutbon`);
check(pay.open === 'pay', `terminal opens the payment ("${pay.label}")`);
await shot('06-pay');
await page.click('#tap-card');
const needsPin = await run(() => !document.getElementById('pin-box').hidden);
if (needsPin) {
  for (const d of '4711') await page.click(`[data-pin="${d}"]`);
  await page.click('[data-pin="ok"]');
}
await page.waitForFunction(() => AMEK.ui.openId === 'receipt', null, { timeout: 10000 });
const receipt = await page.textContent('#receipt-paper');
check(receipt.includes('Leergutbon') && receipt.includes('TSE') && receipt.includes('MwSt'), 'Kassenbon has Leergutbon, VAT table and TSE lines');
await shot('07-receipt');
await page.click('#receipt [data-close]');

// --- out, boot, cart back, drive home
const out = await run(() => {
  const g = AMEK.game;
  g.teleport(4.5, 11.3, Math.PI, 0);
  step(3.0, ['KeyW']);
  return { z: g.player.z, paid: g.cart.items.every((i) => i.paid || i.p.special) };
});
check(out.z > 13.6, 'leaves through the exit doors (z=' + out.z.toFixed(2) + ')');
const loaded = await run(() => {
  const g = AMEK.game;
  const t = g.car.trunk();
  const yaw = g.car.heading + Math.PI;
  g.teleport(t.x + Math.sin(yaw) * 1.0, t.z + Math.cos(yaw) * 1.0, yaw, -0.3);
  step(0.1);
  g.updateFocus();
  g.use();
  step(1);
  return { boot: g.car.items.length, cart: g.cart.items.length };
});
check(loaded.boot > 5 && loaded.cart === 0, `everything loaded into the boot (${loaded.boot} items)`);
await shot('08-boot');
const returned = await run(() => {
  const g = AMEK.game;
  const C = g.world.exterior.corral;
  g.teleport(C.cx, C.z1 + 1.6, 0, 0);
  step(0.1);
  g.updateFocus();
  const label = g.focus?.it?.label();
  g.use();
  return { label, coins: g.state.wallet[100], cart: !!g.cart };
});
check(!returned.cart && returned.coins === 2, `cart returned, euro back ("${returned.label}")`);
const home = await run(() => {
  const g = AMEK.game;
  const d = g.car.door();
  g.teleport(d.x - 0.5, d.z);
  g.updateFocus();
  g.enterCar();
  g.car.place(29, 38, Math.PI);
  step(4, ['KeyW']);
  return { mode: g.mode, z: g.car.z };
});
check(home.mode === 'end', 'driving onto the street ends the trip');
await page.waitForTimeout(400);
await shot('09-end');
const endText = await page.textContent('#end-list');
console.log('  end: ' + endText.replace(/\s+/g, ' ').slice(0, 300));

check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close();
server.close();
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);

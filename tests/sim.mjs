// Watch mode: runs the market on its own for a full week in headless Chromium
// and checks that the circle closes every day.
//   node tests/sim.mjs [--shots dir]
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
const page = await browser.newPage({ viewport: { width: 1100, height: 640 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
let failed = 0;
const check = (ok, msg) => {
  console.log((ok ? '  ok   ' : '  FAIL ') + msg);
  if (!ok) failed++;
};
const run = (fn, arg) => page.evaluate(fn, arg);
const shot = async (name, cam) => {
  if (!shotsDir) return;
  await run((cam) => {
    if (cam) AMEK.watch.hud.camera(cam);
    for (let i = 0; i < 50; i++) AMEK.renderWatch(0.05);
    AMEK.watch.hud.update(5);
    AMEK.watch.hud.charts();
  }, cam);
  await page.screenshot({ path: path.join(shotsDir, name + '.png'), timeout: 300000 });
};

await page.goto(url);
await page.waitForFunction(() => window.AMEK && !document.getElementById('watch').disabled, null, { timeout: 180000 });
console.log('loaded');
await page.evaluate(() => (AMEK.hold = true));
await page.click('#watch');
check(await run(() => !!AMEK.watch && !document.getElementById('sim-hud').hidden && document.getElementById('start').hidden), 'watch mode opens with its HUD');
check(await run(() => !AMEK.game.car.group.visible && AMEK.world.exterior.parkedMeshes.every((m) => !m.visible)), 'the lot starts empty');

// in-page helpers: jump to a clock time, collect what happened
await run(() => {
  const sim = AMEK.sim;
  window.to = (day, hour) => {
    const target = day * 86400 + hour * 3600;
    if (target > sim.clock.t) sim.advance(target - sim.clock.t);
    return sim.clock.label();
  };
  window.seen = (re) => sim.events.some((e) => re.test(e.text));
  // every event of the run, not just the newest 60 the ticker keeps
  window.allEvents = [];
  const log = sim.log.bind(sim);
  sim.log = (text) => {
    window.allEvents.push({ t: sim.clock.t, text });
    log(text);
  };
});

// --- Monday morning: delivery and shift start ---------------------------------
await run(() => to(0, 5.2));
check(await run(() => !!AMEK.sim.truck), 'the truck comes at five');
await run(() => to(0, 5.6));
await shot('sim-01-dock', 'dock');
await run(() => to(0, 6.6));
check(await run(() => allEvents.some((e) => /Lieferung eingeräumt/.test(e.text))), 'the delivery is unloaded into the backroom');
check(await run(() => !AMEK.sim.truck), 'the truck has left before opening');
check(await run(() => AMEK.sim.staff.filter((s) => s.onDuty).length >= 2), 'the early shift is in');

// --- Monday: open, busy, closed -------------------------------------------------
await run(() => to(0, 10));
await shot('sim-02-top', 'top');
const mid = await run(() => AMEK.sim.snapshot());
check(mid.served > 100, `customers are served in the morning (${mid.served} by 10:00)`);
check(mid.tillsOpen >= 1, 'a till is staffed');
await run(() => to(0, 17.6));
await shot('sim-03-tills', 'tills');
await run(() => AMEK.watch.hud.camera('follow'));
await run(() => {
  for (let i = 0; i < 40; i++) AMEK.renderWatch(0.05);
  AMEK.watch.hud.update(5);
});
check(await run(() => !document.getElementById('sim-follow').hidden && document.getElementById('follow-name').textContent.length > 1), 'follow someone shows their card');
await shot('sim-04-follow');
const peak = await run(() => AMEK.sim.snapshot());
check(peak.inside + peak.queue > 3, `the shop is busy in the evening (${peak.inside} inside)`);
check(await run(() => allEvents.some((e) => /Kasse [12] geöffnet/.test(e.text))), 'a second till opens when it gets busy');
await run(() => to(0, 22.4));
await shot('sim-05-night', 'overview');
check(await run(() => AMEK.sim.customers.every((c) => !c.inside)), 'nobody is left in the shop after closing');
await run(() => to(0, 23.5));
const empty = await run(() => ({ c: AMEK.sim.customers.length, s: AMEK.sim.staff.length, v: AMEK.sim.vehicles.length, parked: AMEK.sim.snapshot().parked }));
check(empty.c === 0 && empty.s === 0 && empty.v === 0 && empty.parked === 0, `everyone has gone home by 23:30 (${JSON.stringify(empty)})`);

// --- the HUD ---------------------------------------------------------------------
await run(() => {
  AMEK.watch.hud.update(5);
  AMEK.watch.hud.charts();
});
check(await run(() => document.querySelectorAll('#chart-hour .bar').length >= 14), 'customers-per-hour chart has a bar for every opening hour');
check(await run(() => document.querySelectorAll('#sim-kpis dd').length === 10 && document.getElementById('sim-ticker').children.length > 0), 'numbers and ticker are filled');
await run(() => document.querySelector('[data-speed="1800"]').click());
check(await run(() => AMEK.watch.hud.speed === 1800 && document.querySelector('[data-speed="1800"]').getAttribute('aria-pressed') === 'true'), 'speed buttons switch the time-lapse');
await run(() => {
  AMEK.watch.hud.camera('top');
  for (let i = 0; i < 60; i++) AMEK.renderWatch(0.05);
});
check(await run(() => AMEK.world.store.roof.every((m) => !m.visible)), 'top view lifts the roof off');
await run(() => {
  AMEK.watch.hud.camera('overview');
  for (let i = 0; i < 60; i++) AMEK.renderWatch(0.05);
});
check(await run(() => AMEK.world.store.roof.every((m) => m.visible)), 'the roof is back from the outside');

// "next morning" runs in the page's animation frames; let the loop run for it
await run(() => (AMEK.hold = false));
await page.click('#sim-skip');
await page.waitForFunction(() => !AMEK.watch.hud.skipping, null, { timeout: 120000 });
await run(() => (AMEK.hold = true));
const morning = await run(() => ({ label: AMEK.sim.clock.label(), h: AMEK.sim.clock.hour, day: AMEK.sim.clock.day }));
check(morning.day === 1 && morning.h >= 6.49 && morning.h < 6.6, `"next morning" lands on Tuesday 06:30 (${morning.label})`);
const fill = await run(() => AMEK.sim.stock.fill());
check(fill > 0.95, `shelves are refilled overnight (${Math.round(fill * 100)} %)`);

// --- the rest of the week ---------------------------------------------------------------
const t0 = Date.now();
await run(() => to(7, 6.5));
console.log(`  (six more days in ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
const week = await run(() => AMEK.sim.stats.history.map((d) => ({ wd: d.weekday, served: d.served, revenue: d.revenue, items: d.items, missing: d.missing, delivered: d.delivered, fill: d.fill })));
console.log(week.map((d) => `    ${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][d.wd]}: ${d.served} Kund:innen, ${(d.revenue / 100).toFixed(0)} €, ${d.missing} leer gegriffen, ${d.delivered} geliefert`).join('\n'));
check(week.length === 7, 'a week of daily numbers');
const workdays = week.filter((d) => d.wd < 6);
check(workdays.every((d) => d.served > 500), 'every working day has hundreds of customers');
check(workdays.every((d) => d.delivered > 0), 'a delivery every working day');
check(workdays.every((d) => d.missing < d.items * 0.03), 'empty shelves stay rare (under 3 % of picks)');
const sat = week.find((d) => d.wd === 5), mon = week.find((d) => d.wd === 0);
check(sat.served > mon.served, 'Saturday is busier than Monday');
const sun = week.find((d) => d.wd === 6);
check(sun.served === 0 && sun.delivered === 0, 'Sunday: closed, no truck');
check(await run(() => allEvents.filter((e) => /Der LKW steht an der Rampe/.test(e.text)).length === 7), 'the truck docked on all six working days plus the next Monday');
check(await run(() => AMEK.sim.clock.weekday === 0 && AMEK.sim.clock.week === 2), 'the second week has begun');
check(errors.length === 0, 'no errors in the page' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));

await browser.close();
server.close();
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);

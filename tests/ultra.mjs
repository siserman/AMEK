// Graphics "Ultra" on the WebGPU renderer, in headless Chromium with WebGPU on
// SwiftShader (Vulkan). Checks that it boots on WebGPU, draws a real picture
// in both modes (full: SSGI + TRAA, fast: GTAO + SMAA), and that switching
// levels restarts into the right renderer.
//   node tests/ultra.mjs [--shots dir]
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
const base = `http://localhost:${server.address().port}/index.html`;

// the headless shell can't present WebGPU canvases; the full build with Vulkan on SwiftShader can
const browser = await chromium.launch({
  channel: 'chromium',
  args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader', '--use-webgpu-adapter=swiftshader', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !/404/.test(m.text()) && errors.push(m.text()));
let failed = 0;
const check = (ok, msg) => {
  console.log((ok ? '  ok   ' : '  FAIL ') + msg);
  if (!ok) failed++;
};
const run = (fn, arg) => page.evaluate(fn, arg);
const ready = () => page.waitForFunction(() => window.AMEK && !document.getElementById('go').disabled, null, { timeout: 300000 });
// average brightness and spread of the canvas, to tell a picture from an empty
// frame; drawn in the same task as the render, before the frame is presented
const looks = (fn) =>
  run((fn) => {
    (0, eval)(fn)();
    const src = AMEK.game.renderer.domElement, cv = document.createElement('canvas');
    cv.width = 96;
    cv.height = 54;
    const ctx = cv.getContext('2d');
    ctx.drawImage(src, 0, 0, 96, 54);
    const d = ctx.getImageData(0, 0, 96, 54).data;
    let sum = 0, sq = 0;
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
      sum += l;
      sq += l * l;
    }
    const n = d.length / 4, mean = sum / n;
    return { mean: Math.round(mean), spread: Math.round(Math.sqrt(sq / n - mean * mean)) };
  }, fn);
const frames = (n, fn) =>
  run(
    async ([n, fn]) => {
      for (let i = 0; i < n; i++) {
        (0, eval)(fn)();
        await new Promise((r) => requestAnimationFrame(r));
      }
    },
    [n, fn]
  );
const shot = async (name) => shotsDir && page.screenshot({ path: path.join(shotsDir, name + '.png'), timeout: 300000 });

const supported = await (async () => {
  await page.goto(base + '?test&gfx=low');
  await ready();
  return run(async () => !!navigator.gpu && !!(await navigator.gpu.requestAdapter()));
})();
if (!supported) {
  console.log('  skip  no WebGPU adapter in this browser');
  await browser.close();
  server.close();
  process.exit(0);
}

await page.goto(base + '?test&gfx=ultra');
await ready();
console.log('loaded');
const boot = await run(() => ({ level: AMEK.gfx.level, webgpu: !!AMEK.game.renderer.backend?.isWebGPUBackend }));
check(boot.level === 'ultra' && boot.webgpu, `?gfx=ultra boots on the WebGPU renderer (${JSON.stringify(boot)})`);
check(await run(() => document.querySelector('[data-gfx="ultra"]').getAttribute('aria-pressed') === 'true'), 'the Ultra button shows as chosen');

// the player's view inside the shop
await run(() => {
  AMEK.hold = true;
  document.getElementById('start').hidden = true;
  const c = AMEK.game.camera;
  c.position.set(-1.2, 1.75, 3.2);
  c.lookAt(-7.5, 0.9, 9.5);
});
await frames(8, '() => AMEK.game.render()');
const inside = await looks('() => AMEK.game.render()');
check(inside.mean > 60 && inside.spread > 12, `full quality (SSGI, reflections, TRAA) draws the shop (${JSON.stringify(inside)})`);
await shot('ultra-01-tills');

// watch mode: 1× is full quality, time-lapse speed switches to the fast graph
await run(() => {
  document.getElementById('start').hidden = false;
  document.getElementById('watch').click();
  const w = AMEK.watch;
  w.sim.advance(12 * 3600 - w.sim.clock.t);
  w.hud.setSpeed(1);
  w.cam.preset('shelves');
  w.cam.snap();
});
await frames(8, '() => AMEK.renderWatch(0.02)');
const slow = await run(() => AMEK.gfx.fast);
const shelves = await looks('() => AMEK.renderWatch(0.02)');
check(!slow && shelves.spread > 12, `watching at 1× keeps full quality (${JSON.stringify(shelves)})`);
await shot('ultra-02-shelves');
await run(() => AMEK.watch.hud.setSpeed(300));
await frames(6, '() => AMEK.renderWatch(0.02)');
const fast = await run(() => AMEK.gfx.fast);
const lapse = await looks('() => AMEK.renderWatch(0.02)');
check(fast && lapse.spread > 12, `at 300× the fast graph takes over (${JSON.stringify(lapse)})`);
await run(() => {
  AMEK.watch.sim.advance(19.3 * 3600 - AMEK.watch.sim.clock.t);
  AMEK.watch.hud.setSpeed(1);
  AMEK.watch.cam.preset('lot');
  AMEK.watch.cam.snap();
});
await frames(8, '() => AMEK.renderWatch(0.02)');
const night = await looks('() => AMEK.renderWatch(0.02)');
check(night.mean < 70 && night.spread > 5, `night in Ultra is dark, with lights (${JSON.stringify(night)})`);
await shot('ultra-03-night');
check(errors.length === 0, 'no errors in Ultra' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));

// out of Ultra and back: each is a restart into the other renderer, straight back into watching
await Promise.all([page.waitForNavigation({ timeout: 300000 }), run(() => document.querySelector('#sim-hud [data-gfx-toggle]').click())]);
await ready();
const after = await run(() => ({ level: AMEK.gfx.level, webgpu: !!AMEK.game.renderer.isWebGPURenderer, watching: !!AMEK.watch }));
check(after.level === 'low' && !after.webgpu && after.watching, `the toggle goes from Ultra to Einfach on WebGL, still watching (${JSON.stringify(after)})`);
await run(() => document.querySelector('#sim-hud [data-gfx-toggle]').click());
check(await run(() => AMEK.gfx.level === 'high'), 'next is Hoch, without a restart');
await Promise.all([page.waitForNavigation({ timeout: 300000 }), run(() => document.querySelector('#sim-hud [data-gfx-toggle]').click())]);
await ready();
check(await run(() => AMEK.gfx.level === 'ultra' && !!AMEK.game.renderer.isWebGPURenderer), 'then Ultra again, after a restart');
check(errors.length === 0, 'no errors in the page' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));

await browser.close();
server.close();
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);

// Renders a time-lapse of one AMEK day as an MP4, headless (needs ffmpeg).
//   node tools/timelapse.mjs [--out amek-zeitraffer.mp4] [--size 960x540] [--fps 24] [--gfx high|low] [--frames dir]
// A shot list moves the camera through the day: the delivery at dawn, the
// morning from above, the shop floor, dusk on the car park, the tills at the
// evening peak and closing time. Each frame advances the simulation by a fixed
// step, so the video runs at an even pace within a shot.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, def) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : def);
const out = path.resolve(arg('--out', 'amek-zeitraffer.mp4'));
const [W, H] = arg('--size', '960x540').split('x').map(Number);
const fps = Number(arg('--fps', 24));
const gfx = arg('--gfx', 'high');
const frames = arg('--frames', fs.mkdtempSync(path.join(os.tmpdir(), 'amek-frames-')));
fs.mkdirSync(frames, { recursive: true });

// from, to: clock hours on Monday; step: simulated seconds per frame; spin: camera turn per frame
const SHOTS = [
  { cam: 'dock', from: 4.95, to: 6.0, step: 20, spin: 0.0012, title: 'Fünf Uhr: die Lieferung' },
  { cam: 'overview', from: 6.0, to: 9.5, step: 60, spin: 0.0016, title: 'Der Markt öffnet' },
  { cam: 'top', from: 9.5, to: 11.0, step: 24, spin: 0, title: 'Von oben, ohne Dach' },
  { cam: 'lot', from: 15.5, to: 18.25, step: 45, spin: 0.001, title: 'Feierabendverkehr' },
  { cam: 'tills', from: 18.25, to: 19.25, step: 14, spin: 0.0008, title: '„Kasse 2 bitte!“' },
  { cam: 'overview', from: 19.25, to: 23.0, step: 70, spin: 0.0016, title: 'Ladenschluss' },
];

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

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`http://localhost:${server.address().port}/index.html?test&lowres&gfx=${gfx}`);
await page.waitForFunction(() => window.AMEK && !document.getElementById('watch').disabled, null, { timeout: 180000 });
await page.evaluate(() => (AMEK.hold = true));
await page.click('#watch');
await page.evaluate(() => {
  document.getElementById('sim-hud').hidden = true;
  const cv = document.createElement('canvas');
  const src = AMEK.watch.hud.renderer.domElement;
  cv.width = src.width;
  cv.height = src.height;
  const ctx = cv.getContext('2d');
  // one frame: advance, draw, stamp the clock and the shot's title
  window.frame = (step, spin, title) => {
    const w = AMEK.watch;
    w.cam.yaw += spin;
    w.hud.speed = step * 24;
    AMEK.renderWatch(1 / 24);
    ctx.drawImage(src, 0, 0);
    const k = cv.height / 540;
    const text = w.sim.clock.label();
    ctx.font = `800 ${Math.round(24 * k)}px Archivo, sans-serif`;
    const tw = ctx.measureText(text).width + 30 * k;
    ctx.fillStyle = 'rgba(13, 92, 99, 0.94)';
    ctx.fillRect(18 * k, cv.height - 64 * k, tw, 44 * k);
    ctx.fillStyle = '#ffb000';
    ctx.fillRect(18 * k, cv.height - 24 * k, tw, 4 * k);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 33 * k, cv.height - 34 * k);
    if (title) {
      ctx.font = `700 ${Math.round(17 * k)}px Archivo, sans-serif`;
      const ttw = ctx.measureText(title).width + 24 * k;
      ctx.fillStyle = 'rgba(5, 33, 36, 0.78)';
      ctx.fillRect(18 * k, 18 * k, ttw, 34 * k);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, 30 * k, 41 * k);
    }
    return cv.toDataURL('image/jpeg', 0.9);
  };
});

let n = 0;
const t0 = Date.now();
for (const shot of SHOTS) {
  await page.evaluate((s) => {
    const sim = AMEK.sim, target = s.from * 3600;
    if (target > sim.clock.t) sim.advance(target - sim.clock.t);
    AMEK.watch.cam.preset(s.cam);
    AMEK.watch.cam.snap();
    for (let i = 0; i < 4; i++) AMEK.renderWatch(1 / 24); // settle doors, lights and poses
  }, shot);
  const count = Math.round(((shot.to - shot.from) * 3600) / shot.step);
  for (let i = 0; i < count; i++) {
    const url = await page.evaluate(([s, i]) => frame(s.step, s.spin, i < 72 ? s.title : ''), [shot, i]);
    fs.writeFileSync(path.join(frames, String(n++).padStart(5, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(`${shot.title}: ${count} frames (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
await browser.close();
server.close();

const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, '%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (ff.status !== 0) {
  console.error('ffmpeg failed; the frames are in ' + frames);
  process.exit(1);
}
console.log(`${n} frames → ${out} (${(n / fps).toFixed(1)} s)`);

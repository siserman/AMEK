// AMEK – boot: renderer, data, world, game loop.
import * as THREE from '../vendor/three.module.min.js';
import { loadData } from './data.js';
import { buildWorld } from './world/world.js';
import { Input } from './engine/input.js';
import { Audio } from './engine/audio.js';
import { Game } from './game/game.js';
import { Hud } from './ui/hud.js';
import { Overlays } from './ui/overlays.js';
import { Simulation } from './sim/sim.js';
import { SimCamera } from './sim/camera.js';
import { SimHud } from './ui/simhud.js';
import { Graphics, LEVELS, pickLevel, rememberLevel } from './engine/graphics.js';

const params = new URLSearchParams(location.search);

async function fontsReady(ms = 2500) {
  if (!document.fonts) return;
  const wanted = ['900 40px Archivo', '800 40px "Archivo Narrow"', '700 20px "Archivo Narrow"', '600 20px Archivo'];
  await Promise.race([Promise.all(wanted.map((f) => document.fonts.load(f).catch(() => null))), new Promise((r) => setTimeout(r, ms))]);
}

async function boot() {
  const stage = document.getElementById('stage');
  // Ultra needs the WebGPU renderer, so the level is settled before the renderer
  let level = pickLevel(params, matchMedia('(pointer: coarse)').matches);
  let ultra = null, renderer = null;
  if (level === 'ultra') {
    try {
      ultra = await import('./engine/ultra.js');
      renderer = await ultra.createRenderer();
    } catch (e) {
      console.warn('AMEK: Ultra konnte nicht starten', e);
    }
    if (!renderer) {
      ultra = null;
      level = 'high';
    }
  }
  renderer ||= new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  // Ultra's effects are costly per pixel and TRAA smooths the edges anyway
  renderer.setPixelRatio(Math.min(devicePixelRatio, params.has('lowres') || ultra ? 1 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  stage.appendChild(renderer.domElement);

  const input = new Input(renderer.domElement, document.getElementById('touch'));
  const audio = new Audio();
  const hud = new Hud();

  await fontsReady(params.has('test') ? 300 : 2500);
  const data = await loadData();
  const ui = new Overlays(data, input);
  const world = buildWorld(renderer, data, { shadowSize: params.has('lowres') ? 1024 : 4096, PMREMGenerator: ultra?.PMREMGenerator });
  const game = new Game({ renderer, world, data, input, audio, hud, ui });
  const gfx = new Graphics(renderer, world, ultra);
  window.AMEK = { game, data, world, ui, gfx, THREE };
  // the player's view: sharp shadows around the spot a few metres ahead
  const ahead = new THREE.Vector3();
  game.render = () => {
    game.camera.getWorldDirection(ahead).multiplyScalar(12).add(game.camera.position).setY(0);
    gfx.update({ day: 1, focus: ahead, reach: 46 });
    gfx.render(game.camera);
  };
  const gfxButtons = () => {
    for (const b of document.querySelectorAll('[data-gfx]')) b.setAttribute('aria-pressed', b.dataset.gfx === gfx.level);
    for (const b of document.querySelectorAll('[data-gfx-toggle]')) b.textContent = 'Grafik: ' + LEVELS[gfx.level];
  };
  gfx.onChange(gfxButtons);
  gfx.setLevel(level);
  // into or out of Ultra means another renderer: remember the choice and restart
  // (in watch mode straight back into watching)
  const chooseLevel = (want) => {
    if (gfx.setLevel(want, true)) return;
    rememberLevel(want);
    const q = new URLSearchParams(location.search);
    q.delete('gfx');
    if (watch) q.set('watch', '');
    location.search = q.toString();
  };
  const ultraOk = !!navigator.gpu;
  const order = ultraOk ? ['low', 'high', 'ultra'] : ['low', 'high'];
  for (const b of document.querySelectorAll('[data-gfx]')) {
    if (b.dataset.gfx === 'ultra' && !ultraOk) {
      b.disabled = true;
      b.title = 'Ultra braucht WebGPU (aktuelles Chrome, Edge oder Safari)';
    }
    b.addEventListener('click', () => chooseLevel(b.dataset.gfx));
  }
  for (const b of document.querySelectorAll('[data-gfx-toggle]')) b.addEventListener('click', () => chooseLevel(order[(order.indexOf(gfx.level) + 1) % order.length]));

  const playing = () => game.mode === 'drive' || game.mode === 'walk';
  const resume = () => {
    ui.close();
    input.requestLock();
  };
  ui.initStart((list) => {
    audio.unlock();
    game.start(list);
    ui.close();
    hud.show();
    document.getElementById('touch').hidden = !input.touchMode;
    input.requestLock();
  });
  // watch mode: the market runs on its own, the player only looks
  let watch = null;
  const startWatch = () => {
    ui.close();
    input.uiOpen = true; // no pointer lock, no player controls
    document.getElementById('touch').hidden = true;
    document.body.classList.add('watching');
    const sim = new Simulation({ world, data, game });
    const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.3, 900);
    const cam = new SimCamera(renderer.domElement, camera);
    const shud = new SimHud({ sim, cam, renderer });
    game.mode = 'watch';
    watch = { sim, cam, camera, hud: shud };
    window.AMEK.sim = sim;
    window.AMEK.watch = watch;
    shud.show();
    cam.preset('overview');
  };
  document.getElementById('watch').addEventListener('click', startWatch);
  ui.bindPay();
  ui.onClose = (id) => {
    if (playing() && id !== 'pause') input.requestLock();
  };
  document.getElementById('resume').addEventListener('click', resume);
  document.getElementById('again').addEventListener('click', () => location.reload());
  document.getElementById('mute').addEventListener('click', (e) => {
    audio.unlock();
    e.currentTarget.textContent = audio.toggleMute() ? 'Ton an' : 'Ton aus';
  });
  // Esc releases the mouse: show the pause screen (only if we ever had the lock)
  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement && input.hadLock && playing() && !ui.isOpen() && !input.touchMode) ui.open('pause');
  });
  document.body.classList.toggle('touch', input.touchMode);
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    game.resize();
    gfx.resize();
    if (watch) {
      watch.camera.aspect = innerWidth / innerHeight;
      watch.camera.updateProjectionMatrix();
    }
  });
  ui.ready();
  document.getElementById('watch').disabled = false;
  if (params.has('watch')) startWatch();

  const roof = world.store.roof;
  const renderWatch = (dt) => {
    const { sim, cam, camera, hud: shud } = watch;
    if (!shud.skipping && shud.speed > 0) sim.update(dt, shud.speed);
    else sim.sync(dt, 0);
    cam.update(dt);
    const cut = cam.roofHidden();
    for (const m of roof) m.visible = !cut;
    // keep the haze behind what we look at, however far out the camera is
    world.scene.fog.near = 40 + cam.dist * 0.8;
    world.scene.fog.far = 220 + cam.dist * 2.5;
    gfx.setFast(shud.speed > 10 || shud.skipping);
    gfx.update({ day: sim.lighting.day, focus: cam.target, reach: cam.dist * 1.1, sunDir: sim.lighting.sunDir, time: sim.clock.t * 0.05 });
    gfx.render(camera);
    shud.afterRender();
    shud.update(dt);
  };
  window.AMEK.renderWatch = renderWatch;

  let last = performance.now();
  const frame = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    // tests drive the simulation themselves and set AMEK.hold
    if (window.AMEK.hold) {
      // nothing
    } else if (watch) {
      renderWatch(dt);
    } else {
      if (ui.openId !== 'pause') game.update(dt);
      game.render();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  document.body.classList.add('ready');
}

boot().catch((e) => {
  console.error(e);
  const n = document.getElementById('loading-note');
  if (n) {
    n.hidden = false;
    n.textContent = 'AMEK konnte nicht starten: ' + e.message + '. Läuft die Seite über einen Webserver (nicht als Datei)?';
  }
});

// Graphics quality. "low" draws straight to the screen, as AMEK always did.
// "high" adds ambient occlusion (packs sit in their shelves, corners darken),
// bloom for lights after dark, SMAA edges, a physical sky lit by the actual sun,
// and a shadow map that follows what you look at, so shadows stay sharp.
// "ultra" runs on the WebGPU renderer (see ultra.js) with bounce light and
// floor reflections; it is chosen at startup, the others switch live.
import * as THREE from '../../vendor/three.module.min.js';
import { EffectComposer } from '../../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../../vendor/addons/postprocessing/RenderPass.js';
import { GTAOPass } from '../../vendor/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from '../../vendor/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from '../../vendor/addons/postprocessing/SMAAPass.js';
import { OutputPass } from '../../vendor/addons/postprocessing/OutputPass.js';
import { Sky } from '../../vendor/addons/objects/Sky.js';

export const LEVELS = { low: 'Einfach', high: 'Hoch', ultra: 'Ultra' };
const KEY = 'amek.gfx';

// URL first (?gfx=low|high|ultra), then what this browser chose last time,
// then a guess: phones and tablets start simple, everything else high. Ultra
// needs WebGPU.
export function pickLevel(params, touch) {
  const ok = (l) => l in LEVELS && (l !== 'ultra' || !!navigator.gpu);
  const want = params.get('gfx');
  if (ok(want)) return want;
  try {
    const saved = localStorage.getItem(KEY);
    if (ok(saved)) return saved;
  } catch {
    // storage blocked: fall through to the guess
  }
  return touch || params.has('lowres') ? 'low' : 'high';
}

export function rememberLevel(level) {
  try {
    localStorage.setItem(KEY, level);
  } catch {
    // not remembered, still applied
  }
}

export class Graphics {
  constructor(renderer, world, ultra = null) {
    this.renderer = renderer;
    this.ultraModule = ultra;
    this.webgpu = !!renderer.isWebGPURenderer;
    this.fast = false;
    this.world = world;
    this.scene = world.scene;
    this.sun = world.sun;
    this.level = 'low';
    this.composer = null;
    this.sky = null;
    this.day = 1;
    this.focus = new THREE.Vector3(5, 0, 15);
    this.reach = 52;
    this.tmp = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.up = new THREE.Vector3();
    // the shadow box the world was built with, restored for "low"
    const sc = this.sun.shadow.camera;
    this.wide = { left: sc.left, right: sc.right, top: sc.top, bottom: sc.bottom, normalBias: this.sun.shadow.normalBias };
    this.sunOffset = this.sun.position.clone().sub(this.sun.target.position);
    this.sunHome = this.sun.target.position.clone();
  }

  // Einfach and Hoch switch live on the WebGL renderer; Ultra is the WebGPU
  // renderer and needs a restart to get in or out (returns false then)
  setLevel(level, remember = false) {
    if (!(level in LEVELS) || (level === 'ultra') !== this.webgpu) return false;
    this.level = level;
    if (remember) rememberLevel(level);
    const high = level !== 'low';
    if (level === 'high' && !this.composer) this.build();
    if (level === 'ultra' && !this.ultra) this.buildUltra();
    // a polished floor, for the reflections
    const floor = this.world.store.floor;
    if (floor) floor.material.roughness = level === 'ultra' ? 0.14 : 0.32;
    // High: less flat fill light from the sky, more sun, so shapes read and
    // ambient occlusion has something to work with
    const L = this.world.light;
    // (Ultra adds bounce light of its own, so it takes even less fill)
    const balance = { low: { hemi: 1, sun: 1, env: 1 }, high: { hemi: 0.6, sun: 1.45, env: 0.78 }, ultra: { hemi: 0.5, sun: 1.45, env: 0.7 } };
    Object.assign(L.balance, balance[level]);
    this.world.hemi.intensity = L.hemi * L.balance.hemi;
    this.sun.intensity = L.sun * L.balance.sun;
    this.scene.environmentIntensity = L.env * L.balance.env;
    if (this.sky) this.sky.visible = high;
    this.world.exterior.sky.visible = !high;
    if (!high) {
      this.resetShadow();
      this.world.store.glow?.material.color.setScalar(1);
    }
    for (const fn of this.listeners || []) fn(level);
    return true;
  }

  onChange(fn) {
    (this.listeners ||= []).push(fn);
  }

  build() {
    const r = this.renderer;
    const size = r.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType });
    const composer = new EffectComposer(r, target);
    this.renderPass = new RenderPass(this.scene, null);
    // ambient occlusion at a lower resolution; it is soft anyway
    const gtao = new GTAOPass(this.scene, new THREE.PerspectiveCamera(), size.x, size.y);
    const setSize = gtao.setSize.bind(gtao);
    gtao.setSize = (w, h) => setSize(Math.max(1, Math.round(w * this.aoScale())), Math.max(1, Math.round(h * this.aoScale())));
    gtao.updateGtaoMaterial({ radius: 0.8, distanceExponent: 1.5, thickness: 1.2, scale: 1.9, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 10, rings: 3, samples: 16 });
    gtao.blendIntensity = 1;
    this.gtao = gtao;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.5, 0.45, 1.1);
    this.smaa = new SMAAPass();
    composer.addPass(this.renderPass);
    composer.addPass(gtao);
    composer.addPass(this.bloom);
    composer.addPass(this.smaa);
    composer.addPass(new OutputPass());
    composer.setPixelRatio(1);
    this.composer = composer;
    this.resize();

    // physical sky (Preetham), scaled into the far plane, a bit dimmer than the
    // reference so it sits with the scene's exposure
    const sky = new Sky();
    sky.scale.setScalar(520);
    sky.renderOrder = -1;
    const u = sky.material.uniforms;
    u.turbidity.value = 5.5; // a hazy late-October sky
    u.rayleigh.value = 1.6;
    u.mieCoefficient.value = 0.006;
    u.mieDirectionalG.value = 0.82;
    u.cloudCoverage.value = 0.5; // half cloudy, it's late October
    u.cloudDensity.value = 0.45;
    u.gain = { value: 0.62 };
    sky.material.fragmentShader = sky.material.fragmentShader
      .replace('void main() {', 'uniform float gain;\nvoid main() {')
      .replace('gl_FragColor = vec4( texColor, 1.0 );', 'gl_FragColor = vec4( texColor * gain + vec3( 0.006, 0.009, 0.022 ), 1.0 );');
    sky.visible = false;
    this.scene.add(sky);
    this.sky = sky;
  }

  buildUltra() {
    const U = this.ultraModule;
    this.ultra = new U.UltraPipeline(this.renderer, this.scene);
    this.sky = U.makeSky();
    this.sky.visible = false;
    this.scene.add(this.sky);
  }

  // Ultra at time-lapse speed: drop the effects that build up over frames
  setFast(fast) {
    this.fast = fast;
    if (this.ultra) this.ultra.fast = fast;
  }

  aoScale() {
    return this.renderer.getPixelRatio() > 1.2 ? 0.5 : 1;
  }

  resize() {
    if (!this.composer) return;
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.composer.setSize(size.x, size.y);
    this.bloom.setSize(size.x / 2, size.y / 2);
  }

  // per frame: day 0..1 (night..day), what the camera looks at and how much of it
  update({ day = 1, focus, reach, sunDir, time }) {
    this.day = day;
    if (this.level === 'low') return;
    if (focus) this.focus.copy(focus);
    if (reach) this.reach = reach;
    // bloom only for things brighter than daylight: lamps, headlights, the sun
    const threshold = 1.05 + day * 5, strength = 0.6 - day * 0.32;
    if (this.ultra) this.ultra.setBloom(strength, threshold);
    else Object.assign(this.bloom, { threshold, strength });
    const glow = 1 + (1 - day) * 2.2;
    const lamps = this.world.exterior.lamps, shop = this.world.store.glow;
    if (lamps && day < 0.5) lamps.material.color.setScalar(glow);
    if (shop) shop.material.color.setScalar(day < 0.6 ? glow * 0.8 : 1);
    this.fitShadow();
    // the light never goes below 2° (see sim/lighting.js); the sky gets the real sun
    const s = sunDir || this.tmp.copy(this.sun.position).sub(this.sun.target.position).normalize();
    if (this.ultra) {
      this.sky.sunPosition.value.copy(s); // its clouds drift in real time
      return;
    }
    this.sky.material.uniforms.sunPosition.value.copy(s);
    // clouds drift with simulated time when watching, with real time otherwise
    this.sky.material.uniforms.time.value = time ?? performance.now() / 1000;
  }

  // Fit the sun's shadow box around the focus, snapped to whole shadow texels in
  // light space so the edges don't shimmer while the camera moves.
  fitShadow() {
    const sun = this.sun, sc = sun.shadow.camera;
    const r = Math.max(14, Math.min(60, Math.ceil(this.reach / 4) * 4));
    const dir = this.tmp.copy(sun.position).sub(sun.target.position);
    const dist = dir.length();
    dir.normalize();
    const right = this.right.set(0, 1, 0).cross(dir).normalize();
    const up2 = this.up.crossVectors(dir, right);
    const texel = (2 * r) / sun.shadow.mapSize.x;
    const f = this.focus;
    const a = Math.round(f.dot(right) / texel) * texel, b = Math.round(f.dot(up2) / texel) * texel, c = f.dot(dir);
    const t = sun.target.position.set(0, 0, 0).addScaledVector(right, a).addScaledVector(up2, b).addScaledVector(dir, c);
    sun.position.copy(t).addScaledVector(dir, dist);
    sun.target.updateMatrixWorld();
    if (sc.right !== r) {
      sc.left = sc.bottom = -r;
      sc.right = sc.top = r;
      sc.updateProjectionMatrix();
      sun.shadow.normalBias = Math.max(0.012, texel * 2.2);
    }
  }

  resetShadow() {
    const sun = this.sun, sc = sun.shadow.camera, w = this.wide;
    const dir = this.tmp.copy(sun.position).sub(sun.target.position);
    sun.target.position.copy(this.sunHome);
    sun.position.copy(this.sunHome).add(dir);
    sun.target.updateMatrixWorld();
    Object.assign(sc, { left: w.left, right: w.right, top: w.top, bottom: w.bottom });
    sc.updateProjectionMatrix();
    sun.shadow.normalBias = w.normalBias;
  }

  render(camera) {
    if (this.level === 'ultra') {
      this.ultra.render(camera);
      return;
    }
    if (this.level !== 'high') {
      this.renderer.render(this.scene, camera);
      return;
    }
    this.renderPass.camera = camera;
    this.gtao.camera = camera;
    this.composer.render();
  }
}

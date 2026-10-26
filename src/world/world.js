// Builds the whole scene: lights, sky, car park, market, stocked shelves.
import * as THREE from '../../vendor/three.module.min.js';
import { RoomEnvironment } from '../../vendor/RoomEnvironment.js';
import { CollisionWorld } from '../engine/collision.js';
import { ProductAtlas, TagAtlas } from './atlas.js';
import { ProductSystem } from './products.js';
import { buildStore } from './store.js';
import { buildExterior } from './exterior.js';
import { setAnisotropy } from './textures.js';

export function buildWorld(renderer, data, { shadowSize = 4096 } = {}) {
  setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#b9d3ea');
  scene.fog = new THREE.Fog('#cfdde6', 70, 260);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const hemi = new THREE.HemisphereLight('#f2f6ff', '#b7b6a8', 1.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3df', 2.2);
  sun.position.set(30, 55, 60);
  sun.target.position.set(5, 0, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  const sc = sun.shadow.camera;
  sc.left = -55; sc.right = 55; sc.top = 50; sc.bottom = -50; sc.near = 10; sc.far = 160;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  const col = new CollisionWorld();
  const atlas = new ProductAtlas(data);
  const tagAtlas = new TagAtlas(data);
  const ps = new ProductSystem(data, atlas, scene);
  const ctx = { scene, col, data, ps, atlas, tagAtlas };
  const store = buildStore(ctx);
  const exterior = buildExterior(ctx);
  // base light levels; the graphics level scales them (see engine/graphics.js)
  const light = { hemi: hemi.intensity, sun: sun.intensity, env: scene.environmentIntensity, balance: { hemi: 1, sun: 1, env: 1 } };
  return { scene, sun, hemi, light, col, atlas, tagAtlas, ps, store, exterior };
}

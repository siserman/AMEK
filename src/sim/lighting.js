// Day and night for the simulation: the sun's path for late October at 51° N,
// sky and fog colours, the shop's lights (on from 5:30 until shortly after
// closing) and the car park lamps.
import * as THREE from '../../vendor/three.module.min.js';
import { STORE } from '../world/layout.js';

const RISE = 7.35, SET = 16.9, NOON_ELEV = 27;
const c = (h) => new THREE.Color(h);
const DAY = { sky: c('#ffffff'), fog: c('#cfdde6'), hemiSky: c('#f2f6ff'), hemiGround: c('#b7b6a8') };
const NIGHT = { sky: c('#18203a'), fog: c('#121828'), hemiSky: c('#36456e'), hemiGround: c('#1c2026') };
const DUSK = c('#f0a878');
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function sunAt(hour) {
  if (hour >= RISE && hour <= SET) {
    const f = (hour - RISE) / (SET - RISE);
    return { az: 112 + 136 * f, elev: NOON_ELEV * Math.sin(Math.PI * f) };
  }
  const away = hour < RISE ? RISE - hour : hour - SET;
  return { az: hour < RISE ? 112 : 248, elev: -Math.min(18, away * 12) };
}

export class Lighting {
  constructor(world, scene) {
    this.world = world;
    this.scene = scene;
    this.sun = world.sun;
    this.hemi = world.hemi;
    this.sky = world.exterior.sky;
    this.inside = [];
    // shop lights: a grid of point lights under the ceiling
    for (const x of [-7, 2, 11]) {
      for (const z of [-8, 2]) {
        const l = new THREE.PointLight('#fff6ea', 0, 19, 1.1);
        l.position.set(x, STORE.h - 0.6, z);
        scene.add(l);
        this.inside.push(l);
      }
    }
    const l = new THREE.PointLight('#fff6ea', 0, 9, 1.2);
    l.position.set(15, 3.0, 15.5); // under the entrance canopy
    scene.add(l);
    this.canopy = l;
    this.tmp = new THREE.Color();
  }

  update(hour, shopLights) {
    const s = sunAt(hour);
    const day = smooth(-7, 7, s.elev);
    const dusk = Math.max(0, 1 - Math.abs(s.elev - 2) / 9) * (s.elev > -6 ? 1 : 0);
    const az = (s.az * Math.PI) / 180, el = (Math.max(s.elev, 2) * Math.PI) / 180;
    const t = this.sun.target.position;
    this.sun.position.set(t.x + Math.sin(az) * Math.cos(el) * 90, t.y + Math.sin(el) * 90, t.z - Math.cos(az) * Math.cos(el) * 90);
    this.sun.intensity = 2.3 * smooth(0, 10, s.elev);
    this.sun.color.set('#fff3df').lerp(DUSK, dusk * 0.7);
    this.hemi.intensity = 0.32 + 1.58 * day;
    this.hemi.color.copy(NIGHT.hemiSky).lerp(DAY.hemiSky, day);
    this.hemi.groundColor.copy(NIGHT.hemiGround).lerp(DAY.hemiGround, day);
    this.scene.environmentIntensity = 0.1 + 0.35 * day;
    const fog = this.tmp.copy(NIGHT.fog).lerp(DAY.fog, day).lerp(DUSK, dusk * 0.35);
    this.scene.fog.color.copy(fog);
    if (this.scene.background && this.scene.background.isColor) this.scene.background.copy(fog);
    this.sky.material.color.copy(NIGHT.sky).lerp(DAY.sky, day).lerp(DUSK, dusk * 0.45);
    // inside: bright when the shop lights are on, a little security light otherwise
    const indoor = shopLights ? 26 * (1 - day * 0.55) : 1.5;
    for (const l of this.inside) l.intensity = indoor;
    this.canopy.intensity = shopLights && day < 0.6 ? 14 : 0;
    const ceiling = this.world.store.ceiling;
    if (ceiling) ceiling.material.color.set(shopLights ? '#ffffff' : '#3a3e44');
    const lamps = this.world.exterior.lamps;
    if (lamps) lamps.material.color.set(day < 0.5 ? '#ffffff' : '#c9c9c4');
    this.day = day;
  }
}

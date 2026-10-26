// Outside the market: car park, access road, street, cart corral, trees,
// lamp posts, the AMEK pylon and a row of houses across the street.
import * as THREE from '../../vendor/three.module.min.js';
import { GeoBuilder, vcMat } from './geo.js';
import { STORE, LOT, ACCESS, STREET, CORRAL, DOORS } from './layout.js';
import { asphaltTexture, paverTexture, grassTexture, tex, logoTexture, textPlate, parkingSignCanvas, skyTexture, AMEK, canvas, FONT } from './textures.js';
import { carInto, makeCart, mat } from './models.js';
import { rng } from '../util.js';
import { addSign } from './store.js';

const CAR_COLORS = ['#c9ccd0', '#1f2226', '#8a1c22', '#e8e8e6', '#3b4e6b', '#6b6f73', '#24452f', '#b0a48a', '#f2f2f0', '#2a2d31', '#5d2f6b', '#c46a1d'];

export function buildExterior(ctx) {
  const { scene, col } = ctx;
  const out = { spaces: [], parked: [] };
  const R = rng(2026);

  // --- ground layers with world-space UVs --------------------------------
  const ground = (texCanvas, size, y, rects, rough = 0.95) => {
    const B = new GeoBuilder({ uv: true });
    for (const [x0, z0, x1, z1] of rects) {
      B.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], { u0: x0 / size, u1: x1 / size, v0: -z1 / size, v1: -z0 / size });
    }
    const t = tex(texCanvas, { repeat: [1, 1] });
    const m = new THREE.Mesh(B.build(), new THREE.MeshStandardMaterial({ map: t, roughness: rough }));
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  ground(grassTexture(), 4, -0.03, [[-160, -120, 160, 160]]);
  ground(asphaltTexture(), 6, 0.012, [
    [LOT.x0, LOT.z0, LOT.x1 + 0.5, LOT.z1],
    [ACCESS.x0, ACCESS.z0, ACCESS.x1, STREET.z0],
    [STREET.x0, STREET.z0, STREET.x1, STREET.z1],
  ], 0.9);
  ground(paverTexture(), 2, 0.03, [
    [STORE.x0 - 2, STORE.z1 + STORE.wall, STORE.x1 + 6, LOT.z0],
    [STORE.x1 + 0.3, STORE.z0, STORE.x1 + 6, STORE.z1 + 0.3],
    [STREET.x0, STREET.z1, STREET.x1, STREET.z1 + 3],
    [STREET.x0, STREET.z0 - 2.5, ACCESS.x0, STREET.z0],
    [ACCESS.x1, STREET.z0 - 2.5, STREET.x1, STREET.z0],
  ]);

  const B = new GeoBuilder({ uv: false, color: true }); // painted lines, curbs, posts
  const G = new GeoBuilder({ uv: false, color: true }); // car glass
  const Lt = new GeoBuilder({ uv: false, color: true }); // car lights
  const glow = new GeoBuilder({ uv: false, color: true });

  // --- parking spaces -------------------------------------------------------
  B.color('#f2f2ee');
  LOT.rows.forEach((row, ri) => {
    for (let i = 0; i <= LOT.count; i++) {
      const x = LOT.spacesX0 + i * LOT.spaceW;
      B.flat(x, 0.02, (row.z0 + row.z1) / 2, 0.1, row.z1 - row.z0 - 0.3);
    }
    const backZ = row.facing < 0 ? row.z0 + 0.1 : row.z1 - 0.1;
    B.flat(LOT.spacesX0 + (LOT.count * LOT.spaceW) / 2, 0.02, backZ, LOT.count * LOT.spaceW, 0.1);
    for (let i = 0; i < LOT.count; i++) {
      const cx = LOT.spacesX0 + (i + 0.5) * LOT.spaceW;
      const cz = (row.z0 + row.z1) / 2;
      const kind = ri === 0 && i >= 14 ? (i >= 16 ? 'disabled' : 'family') : ri === 1 && i >= 16 ? 'ev' : '';
      out.spaces.push({ x: cx, z: cz, w: LOT.spaceW, d: row.z1 - row.z0, facing: row.facing, row: ri, kind, occupied: false });
    }
  });
  // special bays
  for (const s of out.spaces) {
    if (!s.kind) continue;
    const c = s.kind === 'disabled' ? '#1d5fae' : s.kind === 'family' ? '#e85a8a' : '#2e9d4a';
    B.color(c);
    B.flat(s.x, 0.021, s.z, 1.4, 1.4);
    B.color('#ffffff');
    B.flat(s.x, 0.022, s.z, 0.9, 0.12);
    B.flat(s.x, 0.022, s.z, 0.12, 0.9);
    if (s.kind === 'ev') {
      // charging post at the back of the bay
      const pz = s.facing > 0 ? s.z + s.d / 2 + 0.4 : s.z - s.d / 2 - 0.4;
      B.color('#e9ecef');
      B.boxMM(s.x - 0.18, 0, pz - 0.15, s.x + 0.18, 1.5, pz + 0.15);
      glow.color('#3dff8a');
      glow.boxMM(s.x - 0.1, 1.2, pz - 0.155, s.x + 0.1, 1.3, pz - 0.15);
      col.box(s.x - 0.2, pz - 0.17, s.x + 0.2, pz + 0.17, 'post');
    }
  }
  // arrows and centre line of the driving aisle
  B.color('#f2f2ee');
  const midZ = (LOT.aisleZ[0] + LOT.aisleZ[1]) / 2;
  for (let x = LOT.x0 + 3; x < LOT.x1 - 2; x += 8) arrow(B, x, midZ + 1.6, 1);
  for (let x = LOT.x0 + 7; x < LOT.x1 - 2; x += 8) arrow(B, x, midZ - 1.6, -1);
  // street markings
  for (let x = STREET.x0; x < STREET.x1; x += 6) B.flat(x, 0.02, (STREET.z0 + STREET.z1) / 2, 3, 0.12);
  B.flat(0, 0.02, STREET.z0 + 0.3, STREET.x1 - STREET.x0, 0.12);
  B.flat(0, 0.02, STREET.z1 - 0.3, STREET.x1 - STREET.x0, 0.12);
  B.flat((ACCESS.x0 + ACCESS.x1) / 2, 0.021, STREET.z0 + 0.2, ACCESS.x1 - ACCESS.x0, 0.4); // give-way line
  B.color('#f2f2ee');
  for (let z = ACCESS.z0 + 6; z < ACCESS.z1 - 3; z += 6) B.flat((ACCESS.x0 + ACCESS.x1) / 2, 0.02, z, 0.12, 3);

  // --- curbs (cars bump, people step over) ----------------------------------
  const curb = (x0, z0, x1, z1) => {
    B.color('#b6b8b4');
    B.boxMM(x0, 0, z0, x1, 0.14, z1);
    col.box(x0, z0, x1, z1, 'curb');
  };
  curb(LOT.x0 - 0.3, LOT.z0 - 0.3, LOT.x1 + 0.5, LOT.z0); // shop side
  curb(LOT.x0 - 0.3, LOT.z1, ACCESS.x0, LOT.z1 + 0.3); // street side
  curb(LOT.x0 - 0.3, LOT.z0, LOT.x0, LOT.z1); // west
  curb(LOT.x1 + 0.2, LOT.z0, ACCESS.x0, LOT.aisleZ[0]); // east, between rows and access road
  curb(LOT.x1 + 0.2, LOT.aisleZ[1], ACCESS.x0, LOT.z1);
  curb(ACCESS.x1, LOT.z0 - 0.3, ACCESS.x1 + 0.3, STREET.z0 - 2.5);
  curb(ACCESS.x0 - 0.3, LOT.z1 + 0.3, ACCESS.x0, STREET.z0 - 2.5);
  curb(ACCESS.x0 - 0.3, LOT.z0 - 0.3, ACCESS.x1 + 0.3, LOT.z0); // top end of the access road
  // world bounds for the car
  col.box(STREET.x0, STREET.z1 + 2.5, STREET.x1, STREET.z1 + 3, 'bound');
  col.box(STREET.x0 - 1, STREET.z0 - 3, STREET.x0, STREET.z1 + 3, 'bound');
  col.box(STREET.x1, STREET.z0 - 3, STREET.x1 + 1, STREET.z1 + 3, 'bound');
  curb(STREET.x0, STREET.z0 - 0.2, ACCESS.x0 - 0.3, STREET.z0);
  curb(ACCESS.x1 + 0.3, STREET.z0 - 0.2, STREET.x1, STREET.z0);
  curb(STREET.x0, STREET.z1, STREET.x1, STREET.z1 + 0.2);

  // --- parked cars ------------------------------------------------------------
  const m = new THREE.Matrix4();
  for (const s of out.spaces) {
    const nearShop = s.row === 0 && s.x > 3 && s.x < 20;
    const p = nearShop ? 0.4 : 0.5;
    const r = R();
    // a few bays near the entrance are always free, like on a quiet Saturday morning
    const keepFree = nearShop && !s.kind && Math.round((s.x - 1.25) / 2.5) % 2 === 0;
    if (s.kind === 'ev' || keepFree || r > p) continue;
    s.occupied = true;
    const heading = s.facing < 0 ? 0 : Math.PI; // nose towards the shop or towards the street
    const jitter = (R() - 0.5) * 0.25;
    m.makeRotationY(heading + (R() - 0.5) * 0.06).setPosition(s.x + jitter, 0, s.z + (R() - 0.5) * 0.3);
    carInto(B, G, Lt, CAR_COLORS[Math.floor(R() * CAR_COLORS.length)], m);
    col.box(s.x + jitter - 0.92, s.z - 2.3, s.x + jitter + 0.92, s.z + 2.3, 'car');
    out.parked.push(s);
  }

  // --- cart corral --------------------------------------------------------------
  const C = CORRAL;
  B.color('#9aa1a8');
  for (const [x, z] of [[C.x0, C.z0], [C.x1, C.z0], [C.x0, C.z1], [C.x1, C.z1]]) B.boxMM(x - 0.04, 0, z - 0.04, x + 0.04, 2.3, z + 0.04);
  B.color(AMEK.petrol);
  B.boxMM(C.x0 - 0.15, 2.3, C.z0 - 0.15, C.x1 + 0.15, 2.4, C.z1 + 0.15);
  B.color('#c3c9cf');
  B.boxMM(C.x0 - 0.02, 0.05, C.z0, C.x0 + 0.02, 0.95, C.z1); // side rails
  B.boxMM(C.x1 - 0.02, 0.05, C.z0, C.x1 + 0.02, 0.95, C.z1);
  B.boxMM(C.x0, 0.05, C.z0 - 0.02, C.x1, 0.95, C.z0 + 0.02); // back rail
  col.box(C.x0 - 0.05, C.z0, C.x0 + 0.05, C.z1, 'corral');
  col.box(C.x1 - 0.05, C.z0, C.x1 + 0.05, C.z1, 'corral');
  col.box(C.x0, C.z0 - 0.05, C.x1, C.z0 + 0.05, 'corral');
  const cx = (C.x0 + C.x1) / 2;
  const sign = textPlate('Einkaufswagen', { w: 1024, h: 160 });
  addSign(scene, sign, cx, 2.05, C.z1 + 0.16, 1.9, 0.3, 0);
  const stack = new THREE.Group();
  scene.add(stack);
  const carts = [];
  for (let i = 0; i < 7; i++) {
    const c = makeCart();
    c.position.set(cx, i * 0.002, C.z0 + 0.6 + i * 0.27); // nose north, handle to the car park
    stack.add(c);
    carts.push(c);
  }
  // the carts in the corral are one solid block; it shrinks as carts are taken
  const block = col.box(cx - 0.3, C.z0 + 0.1, cx + 0.3, C.z0 + 0.6 + 6 * 0.27 + 0.5, 'corral-carts');
  out.corral = { ...C, cx, stack, carts, block, mouth: { x: cx, z: C.z1 + 0.4 } };

  // --- lamps, trees, bike stands, signs ---------------------------------------
  const lamp = (x, z) => {
    B.color('#5d6267');
    B.boxMM(x - 0.07, 0, z - 0.07, x + 0.07, 6.5, z + 0.07);
    B.boxMM(x - 0.06, 6.4, z - 0.9, x + 0.06, 6.5, z + 0.06);
    B.boxMM(x - 0.2, 6.3, z - 1.2, x + 0.2, 6.45, z - 0.6);
    glow.color('#fff3d6');
    glow.boxMM(x - 0.18, 6.29, z - 1.18, x + 0.18, 6.3, z - 0.62);
    col.box(x - 0.1, z - 0.1, x + 0.1, z + 0.1, 'lamp');
  };
  for (let x = -18; x <= 22; x += 10) lamp(x, LOT.aisleZ[0] + 0.25);
  for (let z = 24; z <= 44; z += 10) lamp(ACCESS.x1 + 0.6, z);

  const trees = new GeoBuilder({ uv: false, color: true });
  const tree = (x, z, s = 1) => {
    trees.color('#5b4632');
    trees.cylinder(x, 0, z, 0.14 * s, 2.2 * s, 6);
    const shades = ['#3f6b2c', '#4a7a33', '#36602a'];
    for (let k = 0; k < 3; k++) {
      trees.color(shades[k]);
      trees.ellipsoid(x + (R() - 0.5) * 0.8 * s, 2.6 * s + k * 0.6 * s, z + (R() - 0.5) * 0.8 * s, 1.3 * s, 1.1 * s, 1.3 * s, [0, 0], 8, 6);
    }
    col.circle(x, z, 0.25 * s, 'tree');
  };
  for (let x = LOT.x0 + 2; x < ACCESS.x0 - 2; x += 7) tree(x + R() * 2, LOT.z1 + 3.5 + R() * 2, 0.9 + R() * 0.4);
  for (let z = LOT.z0 + 2; z < LOT.z1; z += 7) tree(LOT.x0 - 3, z + R() * 2, 0.9 + R() * 0.4);
  for (let z = STORE.z0; z < STORE.z1; z += 8) tree(STORE.x0 - 4.5, z, 1.1);
  for (let x = -40; x < 60; x += 9) tree(x + R() * 3, STREET.z1 + 6 + R() * 2, 0.8 + R() * 0.5);
  for (let z = STORE.z0 - 4; z < STORE.z1; z += 7) tree(ACCESS.x1 + 6 + R() * 2, z, 1 + R() * 0.3);

  // bike stands at the front
  B.color('#9aa1a8');
  for (let i = 0; i < 6; i++) {
    const x = -1.2 + i * 0.9;
    B.boxMM(x - 0.02, 0, 16.2, x + 0.02, 0.8, 16.24);
    B.boxMM(x - 0.02, 0, 16.9, x + 0.02, 0.8, 16.94);
    B.boxMM(x - 0.02, 0.76, 16.2, x + 0.02, 0.8, 16.94);
  }
  col.box(-1.3, 16.2, 3.4, 16.95, 'bikes');

  // pylon at the access road
  const py = { x: ACCESS.x1 + 2.6, z: STREET.z0 - 4 };
  B.color('#e9ecef');
  B.boxMM(py.x - 0.6, 0, py.z - 0.25, py.x + 0.6, 7.2, py.z + 0.25);
  B.color(AMEK.petrol);
  B.boxMM(py.x - 0.62, 7.2, py.z - 0.27, py.x + 0.62, 7.3, py.z + 0.27);
  col.box(py.x - 0.6, py.z - 0.25, py.x + 0.6, py.z + 0.25, 'pylon');
  const lt = logoTexture();
  for (const [dz, r] of [[0.26, 0], [-0.26, Math.PI]]) {
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.58), new THREE.MeshStandardMaterial({ map: lt, emissive: '#ffffff', emissiveIntensity: 0.15 }));
    pm.position.set(py.x, 6.4, py.z + dz);
    pm.rotation.y = r;
    scene.add(pm);
  }
  addSign(scene, hoursPlate(), py.x, 4.6, py.z + 0.26, 1.1, 1.1, 0);
  addSign(scene, parkCanvas(), ACCESS.x0 - 1.0, 2.1, STREET.z0 - 3.2, 0.7, 0.98, 0);
  B.color('#9aa1a8');
  B.boxMM(ACCESS.x0 - 1.03, 0, STREET.z0 - 3.25, ACCESS.x0 - 0.97, 1.6, STREET.z0 - 3.19);

  // --- houses across the street ------------------------------------------------
  const H = new GeoBuilder({ uv: false, color: true });
  const walls = ['#e8dcc8', '#d9c9b0', '#f0ece4', '#c9b9a0', '#e3d3c0', '#d0d5d8'];
  const roofs = ['#8a3b2a', '#6b2e22', '#4a4d52', '#7a3a2a'];
  for (let i = 0; i < 9; i++) {
    const x = -46 + i * 12 + R() * 3, z = STREET.z1 + 12 + R() * 3, w = 8 + R() * 2, d = 9, h = 5.5 + R() * 2.5;
    H.color(walls[i % walls.length]);
    H.boxMM(x - w / 2, 0, z, x + w / 2, h, z + d);
    H.color('#3b4650');
    for (let k = 0; k < 3; k++) for (let fl = 0; fl < 2; fl++) H.boxMM(x - w / 2 + 1 + k * (w - 2) / 2.4, 1.2 + fl * 2.6, z - 0.02, x - w / 2 + 2.2 + k * (w - 2) / 2.4, 2.4 + fl * 2.6, z);
    H.color(roofs[i % roofs.length]);
    const r = h + 3;
    H.quad([x - w / 2 - 0.3, h, z - 0.4], [x + w / 2 + 0.3, h, z - 0.4], [x + w / 2 + 0.3, r, z + d / 2], [x - w / 2 - 0.3, r, z + d / 2]);
    H.quad([x + w / 2 + 0.3, h, z + d + 0.4], [x - w / 2 - 0.3, h, z + d + 0.4], [x - w / 2 - 0.3, r, z + d / 2], [x + w / 2 + 0.3, r, z + d / 2]);
    H.tri([x - w / 2, h, z + d], [x - w / 2, h, z], [x - w / 2, r, z + d / 2]);
    H.tri([x + w / 2, h, z], [x + w / 2, h, z + d], [x + w / 2, r, z + d / 2]);
  }

  const add = (Bd, material, shadow = true) => {
    const mesh = new THREE.Mesh(Bd.build(), material);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  add(B, vcMat({ roughness: 0.6, metalness: 0.15 }));
  add(G, vcMat({ roughness: 0.1, metalness: 0.6, side: THREE.DoubleSide }));
  add(Lt, vcMat({ emissive: '#ffffff', emissiveIntensity: 0.2 }), false);
  add(glow, new THREE.MeshBasicMaterial({ vertexColors: true }), false);
  add(trees, vcMat({ roughness: 0.9 }));
  add(H, vcMat({ roughness: 0.9 }));

  // --- sky ---------------------------------------------------------------------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(380, 24, 16), new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -1;
  scene.add(sky);
  out.sky = sky;
  return out;
}

function arrow(B, x, z, dir) {
  B.flat(x, 0.02, z, 2.2, 0.15);
  B.flat(x + dir * 1.0, 0.02, z + 0.25, 0.5, 0.12);
  B.flat(x + dir * 1.0, 0.02, z - 0.25, 0.5, 0.12);
}

function hoursPlate() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = AMEK.petrol;
  g.textAlign = 'center';
  g.font = `800 34px ${FONT}`;
  g.fillText('Mo – Sa', 128, 70);
  g.font = `900 64px ${FONT}`;
  g.fillText('7 – 22', 128, 145);
  g.font = `700 30px ${FONT}`;
  g.fillText('Uhr', 128, 190);
  g.fillStyle = AMEK.amber;
  g.fillRect(40, 214, 176, 12);
  return c;
}

function parkCanvas() {
  const c = canvas(256, 360);
  const g = c.getContext('2d');
  g.drawImage(parkingSignCanvas(), 0, 0, 256, 256);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 260, 256, 100);
  g.fillStyle = '#111';
  g.textAlign = 'center';
  g.font = `800 26px ${FONT}`;
  g.fillText('Nur für Kunden', 128, 296);
  g.font = `600 22px ${FONT}`;
  g.fillText('mit Parkscheibe, 90 Min.', 128, 334);
  return c;
}

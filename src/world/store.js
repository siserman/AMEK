// The AMEK market: shell, glass front, doors, tills, signage and all fixtures.
import * as THREE from '../../vendor/three.module.min.js';
import { GeoBuilder, vcMat } from './geo.js';
import { STORE, DOORS, GATE, RAILS, CHECKOUT, LANES, LANE_END_CAP, PFAND, AISLES, STAFF_DOOR, ANNEX } from './layout.js';
import { gondola, chiller, freezerChest, produceStand, bakery, palletRow, bin, wallShelf, Side, COL, stockShelf } from './fixtures.js';
import { floorTexture, tex, signCanvas, textPlate, logoTexture, posterCanvas, beltTexture, AMEK, canvas, fitFont, FONT } from './textures.js';

const DRINK_LEVELS = [{ y: 0.12, clear: 0.4 }, { y: 0.56, clear: 0.38 }, { y: 0.98, clear: 0.38 }, { y: 1.4, clear: 0.4 }];

export function buildStore(ctx) {
  const { scene, col, data, ps } = ctx;
  const S = STORE;
  const fix = new GeoBuilder({ uv: false, color: true });
  const glow = new GeoBuilder({ uv: false, color: true });
  const glass = new GeoBuilder({ uv: false, color: true });
  const shell = new GeoBuilder({ uv: false, color: true });
  const tags = new GeoBuilder({ uv: true });
  // roof and ceiling are their own meshes so a top-down camera can lift them off
  const roofB = new GeoBuilder({ uv: false, color: true });
  const ceil = new GeoBuilder({ uv: false, color: true });
  Object.assign(ctx, { fix, glow, glass, tags, roofB, ceil, cache: new Map() });
  const out = { doors: {}, lanes: [], signs: [], roof: [] };

  // --- floor & ceiling --------------------------------------------------
  const fw = S.x1 - S.x0, fd = S.z1 - S.z0;
  const ft = tex(floorTexture(), { repeat: [fw / 2.4, fd / 2.4] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.32, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((S.x0 + S.x1) / 2, 0.003, (S.z0 + S.z1) / 2);
  floor.receiveShadow = true;
  scene.add(floor);
  out.floor = floor;
  ceil.color('#d9dcda');
  ceil.quad([S.x0, S.h - 0.23, S.z0], [S.x1, S.h - 0.23, S.z0], [S.x1, S.h - 0.23, S.z1], [S.x0, S.h - 0.23, S.z1]);
  // roof slab, seen from outside
  roofB.color('#8d9296');
  roofB.boxMM(S.x0 - S.wall, S.h - 0.2, S.z0 - S.wall, S.x1 + S.wall, S.h, S.z1 + S.wall);

  // --- walls ------------------------------------------------------------
  const W = S.wall;
  shell.color('#eef0ee');
  shell.boxMM(S.x0 - W, 0, S.z0 - W, S.x1 + W, S.h, S.z0); // back
  shell.boxMM(S.x0 - W, 0, S.z0, S.x0, S.h, S.z1 + W); // west
  // east wall with the staff door ("Nur für Personal") into the backroom
  const SD = STAFF_DOOR;
  shell.boxMM(S.x1, 0, S.z0, S.x1 + W, S.h, SD.z0);
  shell.boxMM(S.x1, 0, SD.z1, S.x1 + W, S.h, S.z1 + W);
  shell.boxMM(S.x1, 2.2, SD.z0, S.x1 + W, S.h, SD.z1);
  col.box(S.x0 - W, S.z0 - W, S.x1 + W, S.z0, 'wall');
  col.box(S.x0 - W, S.z0, S.x0, S.z1 + W, 'wall');
  col.box(S.x1, S.z0, S.x1 + W, SD.z0, 'wall');
  col.box(S.x1, SD.z1, S.x1 + W, S.z1 + W, 'wall');
  shell.color('#a9adaa');
  shell.boxMM(S.x1, 0, SD.z0, S.x1 + W, 0.012, SD.z1);
  out.staffDoor = swingDoor(scene, S.x1 + W / 2, (SD.z0 + SD.z1) / 2, SD.z1 - SD.z0, Math.PI / 2, '#8a939b');
  out.staffDoor.collider = col.box(S.x1 - 0.05, SD.z0, S.x1 + W + 0.05, SD.z1, 'staffdoor');
  addSign(scene, textPlate('Nur für Personal', { w: 512, h: 96, bg: '#5d6267' }), S.x1 - 0.02, 2.35, (SD.z0 + SD.z1) / 2, 1.1, 0.2, -Math.PI / 2);
  // outside cladding: grey base, white panels, petrol band
  shell.color('#5d6267');
  shell.boxMM(S.x0 - W - 0.02, 0, S.z0 - W - 0.02, S.x1 + W + 0.02, 0.6, S.z0 - W);
  shell.boxMM(S.x0 - W - 0.02, 0, S.z0 - W, S.x0 - W, 0.6, S.z1 + W);
  shell.boxMM(S.x1 + W, 0, S.z0 - W, S.x1 + W + 0.02, 0.6, S.z1 + W);
  shell.color(AMEK.petrol);
  shell.boxMM(S.x0 - W - 0.03, S.h - 0.7, S.z0 - W - 0.03, S.x1 + W + 0.03, S.h, S.z0 - W);
  shell.boxMM(S.x0 - W - 0.03, S.h - 0.7, S.z0 - W, S.x0 - W, S.h, S.z1 + W + 0.03);
  shell.boxMM(S.x1 + W, S.h - 0.7, S.z0 - W, S.x1 + W + 0.03, S.h, S.z1 + W + 0.03);

  // front: solid on the west, glass with two sliding doors on the east
  const zf = S.z1;
  const glassFrom = -2;
  shell.color('#eef0ee');
  shell.boxMM(S.x0 - W, 0, zf, glassFrom, S.h, zf + W);
  col.box(S.x0 - W, zf, glassFrom, zf + W, 'wall');
  shell.color('#5d6267');
  shell.boxMM(S.x0 - W, 0, zf + W, glassFrom, 0.6, zf + W + 0.02);
  // parapet over the whole front with the logo
  shell.color('#f7f8f7');
  shell.boxMM(S.x0 - W, S.h - 0.2, zf, S.x1 + W, S.h + 1.3, zf + W);
  shell.color(AMEK.petrol);
  shell.boxMM(S.x0 - W - 0.01, S.h + 1.1, zf - 0.01, S.x1 + W + 0.01, S.h + 1.3, zf + W + 0.03);
  const gaps = [[DOORS.exit.x - DOORS.exit.w / 2, DOORS.exit.x + DOORS.exit.w / 2], [DOORS.entry.x - DOORS.entry.w / 2, DOORS.entry.x + DOORS.entry.w / 2]];
  const segs = [];
  let gx = glassFrom;
  for (const [a, b] of gaps) {
    segs.push([gx, a]);
    gx = b;
  }
  segs.push([gx, S.x1]);
  const doorTop = 2.6;
  for (const [a, b] of segs) {
    glass.color('#9fc3cf');
    glass.boxMM(a, 0.05, zf + 0.12, b, S.h - 0.25, zf + 0.16);
    col.box(a, zf, b, zf + W, 'glass');
    shell.color('#4b5157');
    for (let x = a; x <= b + 0.01; x += (b - a) / Math.max(1, Math.round((b - a) / 2))) shell.boxMM(x - 0.04, 0, zf + 0.08, x + 0.04, S.h - 0.2, zf + 0.2);
    shell.boxMM(a, 0, zf + 0.06, b, 0.06, zf + 0.22);
  }
  for (const [a, b] of gaps) {
    shell.color('#4b5157');
    shell.boxMM(a - 0.06, 0, zf + 0.06, a, S.h - 0.2, zf + 0.22);
    shell.boxMM(b, 0, zf + 0.06, b + 0.06, S.h - 0.2, zf + 0.22);
    shell.boxMM(a, doorTop, zf + 0.06, b, doorTop + 0.25, zf + 0.22);
    glass.color('#9fc3cf');
    glass.boxMM(a, doorTop + 0.25, zf + 0.12, b, S.h - 0.25, zf + 0.16);
  }
  // sliding door leaves
  for (const key of ['entry', 'exit']) {
    const d = DOORS[key];
    const leaves = [];
    for (const s of [-1, 1]) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(d.w / 2, doorTop - 0.05, 0.04), new THREE.MeshStandardMaterial({ color: '#b9d6df', transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.4 }));
      const frame = new THREE.Mesh(new THREE.BoxGeometry(d.w / 2, 0.08, 0.06), new THREE.MeshStandardMaterial({ color: '#4b5157' }));
      frame.position.y = -(doorTop - 0.05) / 2 + 0.04;
      leaf.add(frame);
      leaf.position.set(d.x + (s * d.w) / 4, (doorTop - 0.05) / 2 + 0.02, zf + 0.25);
      leaf.userData.closedX = leaf.position.x;
      leaf.userData.dir = s;
      scene.add(leaf);
      leaves.push(leaf);
    }
    const c = col.box(d.x - d.w / 2, zf, d.x + d.w / 2, zf + W + 0.1, 'door-' + key);
    out.doors[key] = { ...d, z: zf, leaves, collider: c, open: 0, target: 0 };
  }
  // door labels & opening hours
  addSign(scene, textPlate('Eingang', { w: 512, h: 96 }), DOORS.entry.x, doorTop + 0.12, zf + 0.25, 1.3, 0.24, 0);
  addSign(scene, textPlate('Ausgang', { w: 512, h: 96 }), DOORS.exit.x, doorTop + 0.12, zf + 0.25, 1.3, 0.24, 0);
  addSign(scene, textPlate('Ausgang', { w: 512, h: 96 }), DOORS.exit.x, doorTop + 0.12, zf + 0.04, 1.3, 0.24, Math.PI);
  addSign(scene, hoursCanvas(), DOORS.entry.x + 1.75, 1.35, zf + 0.23, 0.5, 0.7, 0);
  // logo on the parapet and a poster in the window
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshStandardMaterial({ map: logoTexture(), roughness: 0.5, emissive: '#ffffff', emissiveIntensity: 0.08 }));
  logo.position.set(10, S.h + 0.4, zf + W + 0.02);
  scene.add(logo);
  const logo2 = logo.clone();
  logo2.position.set(-6.5, S.h + 0.4, zf + W + 0.02);
  scene.add(logo2);
  addSign(scene, posterCanvas('broetchen'), 9.5, 1.45, zf + 0.19, 1.2, 1.8, 0);
  addSign(scene, posterCanvas('claim'), 12.0, 1.45, zf + 0.19, 1.2, 1.8, 0);
  addSign(scene, posterCanvas('claim'), -4.5, 1.6, zf + W + 0.01, 1.4, 2.1, 0);
  // canopy over the entrance
  shell.color('#e9ebec');
  shell.boxMM(1.5, 3.25, zf + W, S.x1 + W, 3.5, zf + 3.2);
  shell.color(AMEK.petrol);
  shell.boxMM(1.5, 3.2, zf + 3.15, S.x1 + W, 3.55, zf + 3.25);
  glow.color('#fff8e6');
  for (let x = 3; x < S.x1; x += 3) glow.boxMM(x - 0.5, 3.22, zf + 1.2, x + 0.5, 3.25, zf + 1.4);
  shell.color('#6b7177');
  for (let x = 2.0; x <= S.x1; x += 4) {
    shell.boxMM(x - 0.1, 0, zf + 2.95, x + 0.1, 3.25, zf + 3.15);
    col.box(x - 0.1, zf + 2.95, x + 0.1, zf + 3.15, 'pillar');
  }

  // --- railings & entry gate ------------------------------------------
  for (const [x0, z0, x1, z1] of RAILS) {
    railing(fix, x0, z0, x1, z1);
    col.box(x0, z0 - 0.04, x1, z1 + 0.04, 'rail');
  }
  const gate = new THREE.Group();
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry((GATE.x1 - GATE.x0) / 2, 0.06, 0.04), new THREE.MeshStandardMaterial({ color: '#c3c9cf', metalness: 0.6, roughness: 0.3 }));
    const pivot = new THREE.Group();
    pivot.position.set(s < 0 ? GATE.x0 : GATE.x1, 0.9, GATE.z);
    arm.position.x = (-s * (GATE.x1 - GATE.x0)) / 4;
    pivot.add(arm);
    pivot.userData.side = s;
    gate.add(pivot);
  }
  scene.add(gate);
  fix.color('#9aa1a8');
  fix.boxMM(GATE.x0 - 0.06, 0, GATE.z - 0.06, GATE.x0, 1.05, GATE.z + 0.06);
  fix.boxMM(GATE.x1, 0, GATE.z - 0.06, GATE.x1 + 0.06, 1.05, GATE.z + 0.06);
  out.gate = { group: gate, collider: col.box(GATE.x0, GATE.z - 0.05, GATE.x1, GATE.z + 0.05, 'gate'), open: 0 };
  addSign(scene, textPlate('Kein Ausgang', { w: 512, h: 96, bg: '#c8102e' }), (GATE.x0 + GATE.x1) / 2, 1.25, GATE.z - 0.07, 0.7, 0.13, Math.PI);

  // --- fixtures ----------------------------------------------------------
  const A = AISLES;
  const products = data.products;
  const pick = (...secs) => products.filter((p) => secs.includes(p.section));

  // fruit & veg
  const produce = pick('obst-gemuese');
  const wallItems = produce.filter((_, i) => i % 3 !== 2);
  const islandItems = produce.filter((_, i) => i % 3 === 2);
  produceStand(ctx, new Side(A.produceWall.x, A.produceWall.z0, -Math.PI / 2, A.produceWall.z1 - A.produceWall.z0, A.produceWall.depth), wallItems, { name: 'produce-wall' });
  const isl = A.produceIsland;
  const half = Math.ceil(islandItems.length / 2);
  produceStand(ctx, new Side(isl.cx, isl.z1, Math.PI / 2, isl.z1 - isl.z0, 0.7), islandItems.slice(0, half), { name: 'produce-island-e', tiers: 2 });
  produceStand(ctx, new Side(isl.cx, isl.z0, -Math.PI / 2, isl.z1 - isl.z0, 0.7), islandItems.slice(half), { name: 'produce-island-w', tiers: 2 });
  // flowers by the entrance
  const fl = A.flowers;
  produceStand(ctx, new Side(fl.x1, fl.z + 0.4, Math.PI, fl.x1 - fl.x0, 0.8), pick('blumen'), { name: 'flowers', tiers: 2, tilt: 0 });
  // bakery
  bakery(ctx, A.bakery.x0, A.bakery.x1, A.bakery.z, pick('backstation'));
  // chilled wall
  out.chiller = chiller(ctx, A.chiller.x0, A.chiller.x1, A.chiller.z, A.chiller.sections);
  // aisles
  const [gz0, gz1] = A.gondolaZ;
  out.gondolas = A.gondolas.map((g) => gondola(ctx, g.cx, gz0, gz1, g.east, g.west));
  freezerChest(ctx, A.freezer.cx, A.freezer.z0, A.freezer.z1, A.freezer.east, A.freezer.west);
  gondola(ctx, A.drinks.cx, A.drinks.z0, A.drinks.z1, A.drinks.east, A.drinks.west, { levels: DRINK_LEVELS });
  const water = pick('wasser');
  palletRow(ctx, new Side(A.pallets.x, A.pallets.z0 + water.length * 1.35, Math.PI / 2, water.length * 1.35, A.pallets.depth), water, { name: 'pallets' });
  for (const b of A.bins) bin(ctx, b.cx, b.cz, b.ids.map((id) => data.byId.get(id)), 'bin-' + b.cx);
  // seasonal two-sided display
  const sea = A.season;
  seasonDisplay(ctx, sea.cx, sea.cz, pick('saison'));

  // --- tills ------------------------------------------------------------
  buildTills(ctx, out);

  // --- reverse vending machine (Pfandautomat) ----------------------------
  buildPfand(ctx, out);

  // --- hanging signs -------------------------------------------------------
  const secName = (id) => data.sections.get(id)?.name || id;
  const sections = data.sections;
  const hang = (title, sub, color, x, z, w = 3.2, rot = 0, y = 3.25) => {
    const s = addSign(scene, signCanvas(title, sub, color), x, y, z, w, w / 4, rot, true);
    out.signs.push(s);
    fix.color('#7b8288');
    const ax = rot ? 0 : w * 0.4, az = rot ? w * 0.4 : 0;
    for (const k of [-1, 1]) fix.boxMM(x + k * ax - 0.01, y + w / 8, z + k * az - 0.01, x + k * ax + 0.01, S.h - 0.2, z + k * az + 0.01);
  };
  hang('Obst & Gemüse', 'Frisch aus der Region', sections.get('obst-gemuese').color, 15.6, 2.0, 3.4, 0);
  hang('Backstation', 'Frisch gebacken, den ganzen Tag', sections.get('backstation').color, 13.6, -10.2, 3.4, 0);
  const aisleNames = [];
  for (let i = 0; i < A.gondolas.length; i++) {
    const left = i === 0 ? A.gondolas[0].east : A.gondolas[i - 1].west;
    const right = i === 0 ? null : A.gondolas[i].east;
    aisleNames.push([left, right]);
  }
  // aisle between gondola k-1 (west face) and gondola k (east face)
  const gs = A.gondolas;
  for (let i = 1; i < gs.length; i++) {
    const x = (gs[i - 1].cx + gs[i].cx) / 2;
    const names = [...gs[i - 1].west, ...gs[i].east].map(secName);
    hang('Gang ' + i, names.join(' · '), sections.get(gs[i].east[0]).color, x, gz1 + 0.6, 2.8, 0);
  }
  hang('Frühstück & Brot', [...gs[0].east].map(secName).join(' · '), sections.get('fruehstueck').color, gs[0].cx + 1.7, gz1 + 0.6, 2.8, 0);
  hang('Gang ' + gs.length, [...gs[gs.length - 1].west].map(secName).join(' · ') + ' · Tiefkühl', sections.get('haushalt').color, (gs[gs.length - 1].cx + A.freezer.cx) / 2, gz1 + 0.6, 2.8, 0);
  hang('Tiefkühl & Eis', 'Pizza, Gemüse, Fisch, Eis', sections.get('tk').color, A.freezer.cx, -4.2, 3.0, Math.PI / 2, 3.0);
  hang('Getränke', 'Wasser · Säfte · Bier & Wein', sections.get('wasser').color, -9.6, gz1 + 0.6, 3.0, 0);
  hang('Kühlregal', 'Molkerei · Käse · Wurst · Fleisch', sections.get('molkerei').color, -1.0, -10.6, 3.6, 0);
  hang('Aktion der Woche', 'Solange der Vorrat reicht', AMEK.amber, -1.0, 3.2, 3.2, 0, 3.0);
  // chiller fascia: section names over their stretch
  const csec = A.chiller.sections;
  const counts = csec.map((id) => products.filter((p) => p.section === id).reduce((s, p) => s + p.dim[0] * 2 + 0.02, 0));
  const tot = counts.reduce((a, b) => a + b, 0);
  let cx = A.chiller.x0;
  csec.forEach((id, i) => {
    const w = ((A.chiller.x1 - A.chiller.x0) * counts[i]) / tot;
    addSign(scene, textPlate(secName(id), { w: 1024, h: 96, bg: AMEK.petrol }), cx + w / 2, 1.99, A.chiller.z + 0.85 - 0.1 + 0.012, Math.min(w - 0.2, 3.2), 0.26, 0);
    cx += w;
  });

  // ceiling lights
  ceil.color('#ffffff');
  for (let z = -11; z <= 11; z += 2.75) ceil.boxMM(S.x0 + 0.6, S.h - 0.28, z - 0.14, S.x1 - 0.6, S.h - 0.24, z + 0.14);

  // --- backroom annex & loading dock --------------------------------------
  buildAnnex(ctx, out);

  // --- finish meshes -----------------------------------------------------
  const add = (B, material, { shadow = false } = {}) => {
    const m = new THREE.Mesh(B.build(), material);
    m.receiveShadow = true;
    m.castShadow = shadow;
    scene.add(m);
    return m;
  };
  add(shell, vcMat({ roughness: 0.8 }), { shadow: true });
  add(fix, vcMat({ roughness: 0.55, metalness: 0.1 }));
  out.glow = add(glow, new THREE.MeshBasicMaterial({ vertexColors: true }));
  out.roof.push(add(roofB, vcMat({ roughness: 0.85 }), { shadow: true }));
  out.ceiling = add(ceil, new THREE.MeshBasicMaterial({ vertexColors: true }));
  out.roof.push(out.ceiling);
  const gm = add(glass, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.5, depthWrite: false }));
  gm.renderOrder = 2;
  const tm = add(tags, new THREE.MeshStandardMaterial({ map: ctx.tagAtlas.texture, roughness: 0.6 }));
  tm.name = 'price-tags';
  return out;
}

function laneSign(n, open) {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = open ? AMEK.petrol : '#5d6267';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = open ? '#ffffff' : '#c9ced2';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `900 170px ${FONT}`;
  g.fillText(String(n), 128, 112);
  g.font = `700 36px ${FONT}`;
  g.fillStyle = open ? AMEK.amber : '#9aa1a8';
  g.fillText(open ? 'geöffnet' : 'geschlossen', 128, 222);
  return c;
}

// Two swinging leaves in a wall; rotY turns the door to face along the wall.
function swingDoor(scene, x, z, w, rotY, color) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  const leaves = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.x = (s * w) / 2;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 0.02, 2.15, 0.05), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
    leaf.position.set((-s * w) / 4, 1.08, 0);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), new THREE.MeshStandardMaterial({ color: '#1c2630', roughness: 0.1 }));
    win.position.set(0, 0.45, 0.03);
    leaf.add(win);
    const win2 = win.clone();
    win2.position.z = -0.03;
    win2.rotation.y = Math.PI;
    leaf.add(win2);
    pivot.add(leaf);
    pivot.userData.side = s;
    g.add(pivot);
    leaves.push(pivot);
  }
  scene.add(g);
  return { group: g, leaves, open: 0, x, z };
}

function buildAnnex(ctx, out) {
  const { scene, col, roofB } = ctx;
  const A = ANNEX, W = 0.25, H = A.h;
  const B = new GeoBuilder({ uv: false, color: true });
  // walls: north, south (with a personnel door), east (with the dock door)
  B.color('#e4e6e3');
  B.boxMM(A.x0, 0, A.z0, A.x1, H, A.z0 + W);
  B.boxMM(A.x0, 0, A.z1 - W, A.door.x0, H, A.z1);
  B.boxMM(A.door.x1, 0, A.z1 - W, A.x1, H, A.z1);
  B.boxMM(A.door.x0, 2.2, A.z1 - W, A.door.x1, H, A.z1);
  B.boxMM(A.x1 - W, 0, A.z0, A.x1, H, A.dock.z0);
  B.boxMM(A.x1 - W, 0, A.dock.z1, A.x1, H, A.z1);
  B.boxMM(A.x1 - W, A.dock.h, A.dock.z0, A.x1, H, A.dock.z1);
  B.color('#5d6267');
  B.boxMM(A.x0, 0, A.z0 - 0.02, A.x1 + 0.02, 0.6, A.z0);
  B.boxMM(A.x1, 0, A.z0, A.x1 + 0.02, 0.6, A.dock.z0);
  B.boxMM(A.x1, 0, A.dock.z1, A.x1 + 0.02, 0.6, A.z1);
  B.color('#0d5c63');
  B.boxMM(A.x0, H - 0.5, A.z0 - 0.03, A.x1 + 0.03, H, A.z0);
  B.boxMM(A.x1, H - 0.5, A.z0, A.x1 + 0.03, H, A.z1 + 0.03);
  B.boxMM(A.x0, H - 0.5, A.z1, A.x1, H, A.z1 + 0.03);
  // concrete floor and the dock: leveller, rubber bumpers, a lamp
  B.color('#a9adaa');
  B.boxMM(A.x0, 0, A.z0, A.x1, 0.02, A.z1);
  B.color('#2b2d30');
  B.boxMM(A.x1, 0.95, A.dock.z0 - 0.35, A.x1 + 0.25, 1.35, A.dock.z0 - 0.1);
  B.boxMM(A.x1, 0.95, A.dock.z1 + 0.1, A.x1 + 0.25, 1.35, A.dock.z1 + 0.35);
  B.color('#ffcc00');
  B.boxMM(A.x1, 0, A.dock.z0, A.x1 + 0.06, 0.08, A.dock.z1);
  B.color('#3a3f44');
  B.boxMM(A.x1 + 0.02, A.dock.h + 0.15, (A.dock.z0 + A.dock.z1) / 2 - 0.2, A.x1 + 0.4, A.dock.h + 0.3, (A.dock.z0 + A.dock.z1) / 2 + 0.2);
  // racks with boxed stock along the north wall
  const R = [[A.x0 + 0.4, A.z0 + 0.35, A.x1 - 2.0, A.z0 + 1.25]];
  for (const [x0, z0, x1, z1] of R) {
    B.color('#2f6fb5');
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 3) B.boxMM(x - 0.05, 0, z0, x + 0.05, 3.2, z0 + 0.08), B.boxMM(x - 0.05, 0, z1 - 0.08, x + 0.05, 3.2, z1);
    for (const y of [0.15, 1.15, 2.15, 3.1]) {
      B.color('#f08a1c');
      B.boxMM(x0, y, z0, x1, y + 0.08, z1);
      if (y > 3) continue;
      const cols = ['#c8a477', '#b38e5f', '#d9b98a'];
      for (let k = 0; k < 9; k++) {
        B.color(cols[k % 3]);
        const bx = x0 + 0.1 + k * ((x1 - x0 - 0.2) / 9);
        B.boxMM(bx, y + 0.08, z0 + 0.1, bx + (x1 - x0) / 9 - 0.12, y + 0.5 + (k % 2) * 0.2, z1 - 0.1);
      }
    }
  }
  const mesh = new THREE.Mesh(B.build(), vcMat({ roughness: 0.8 }));
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
  roofB.color('#8d9296');
  roofB.boxMM(A.x0, H - 0.18, A.z0, A.x1 + 0.03, H, A.z1 + 0.03);
  // the dock's roll-up door, and the personnel door
  const roll = new THREE.Mesh(new THREE.BoxGeometry(0.08, A.dock.h, A.dock.z1 - A.dock.z0), new THREE.MeshStandardMaterial({ color: '#b9bec2', roughness: 0.6, metalness: 0.3 }));
  roll.position.set(A.x1 - 0.12, A.dock.h / 2, (A.dock.z0 + A.dock.z1) / 2);
  scene.add(roll);
  out.dock = { door: roll, open: 0, x: A.x1, z: (A.dock.z0 + A.dock.z1) / 2, collider: col.box(A.x1 - 0.25, A.dock.z0, A.x1, A.dock.z1, 'dock') };
  out.annexDoor = swingDoor(scene, (A.door.x0 + A.door.x1) / 2, A.z1 - 0.12, A.door.x1 - A.door.x0, 0, '#5d6267');
  out.annexDoor.collider = col.box(A.door.x0, A.z1 - W, A.door.x1, A.z1, 'annexdoor');
  col.box(A.x0, A.z0, A.x1, A.z0 + W, 'wall');
  col.box(A.x0, A.z1 - W, A.door.x0, A.z1, 'wall');
  col.box(A.door.x1, A.z1 - W, A.x1, A.z1, 'wall');
  col.box(A.x1 - W, A.z0, A.x1, A.dock.z0, 'wall');
  col.box(A.x1 - W, A.dock.z1, A.x1, A.z1, 'wall');
  addSign(scene, textPlate('Warenannahme', { w: 1024, h: 160 }), A.x1 + 0.03, 3.75, (A.dock.z0 + A.dock.z1) / 2, 2.4, 0.38, Math.PI / 2);
}

function hoursCanvas() {
  const c = canvas(256, 360);
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 360);
  g.fillStyle = AMEK.petrol;
  g.fillRect(0, 0, 256, 70);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.font = `800 34px ${FONT}`;
  g.fillText('Öffnungszeiten', 128, 48);
  g.fillStyle = '#1a1a1a';
  g.font = `700 30px ${FONT}`;
  g.fillText('Mo – Sa', 128, 130);
  g.font = `900 52px ${FONT}`;
  g.fillText('7 – 22 Uhr', 128, 190);
  g.font = `600 22px ${FONT}`;
  g.fillText('So & feiertags geschlossen', 128, 250);
  g.fillText('Pfandautomat innen rechts', 128, 300);
  return c;
}

// A flat sign. Two-sided signs are two planes back to back so neither side reads mirrored.
export function addSign(scene, cnv, x, y, z, w, h, rotY = 0, twoSided = false) {
  const m = new THREE.MeshBasicMaterial({ map: tex(cnv) });
  const geo = new THREE.PlaneGeometry(w, h);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  if (twoSided) {
    const back = new THREE.Mesh(geo, m);
    back.rotation.y = Math.PI;
    back.position.z = -0.002;
    mesh.add(back);
  }
  scene.add(mesh);
  return mesh;
}

function railing(B, x0, z0, x1, z1) {
  B.color('#a9b0b6');
  const dx = x1 - x0, dz = z1 - z0;
  const along = Math.abs(dx) > Math.abs(dz);
  const len = along ? Math.abs(dx) : Math.abs(dz);
  const n = Math.max(1, Math.round(len / 1.2));
  for (let i = 0; i <= n; i++) {
    const x = along ? x0 + (dx * i) / n : (x0 + x1) / 2;
    const z = along ? (z0 + z1) / 2 : z0 + (dz * i) / n;
    B.boxMM(x - 0.025, 0, z - 0.025, x + 0.025, 1.0, z + 0.025);
  }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const hx = along ? len / 2 : 0.025, hz = along ? 0.025 : len / 2;
  B.boxMM(cx - hx, 0.97, cz - hz, cx + hx, 1.02, cz + hz);
  B.boxMM(cx - hx, 0.5, cz - hz, cx + hx, 0.53, cz + hz);
}

function seasonDisplay(ctx, cx, cz, products) {
  const { fix, col, ps } = ctx;
  const L = 1.6, D = 0.42, H = 1.5;
  const levels = [{ y: 0.12, clear: 0.34 }, { y: 0.55, clear: 0.34 }, { y: 0.98, clear: 0.34 }];
  const sides = [new Side(cx - L / 2, cz, 0, L, D), new Side(cx + L / 2, cz, Math.PI, L, D)];
  fix.color('#a61d24');
  fix.boxMM(cx - L / 2, 0, cz - 0.02, cx + L / 2, H, cz + 0.02);
  for (const s of sides) {
    fix.color('#a61d24');
    s.box(fix, 0, L, 0, 0.1, 0.02, D);
    s.box(fix, 0, 0.03, 0, H, 0, D);
    s.box(fix, L - 0.03, L, 0, H, 0, D);
    for (const lv of levels) {
      fix.color('#f2d29a');
      s.box(fix, 0, L, lv.y - 0.02, lv.y, 0, D - 0.02);
    }
  }
  fix.color('#f2d29a');
  fix.boxMM(cx - L / 2, H, cz - 0.03, cx + L / 2, H + 0.32, cz + 0.03);
  addSign(ctx.scene, textPlate('Weihnachtsgebäck', { w: 1024, h: 200, bg: '#a61d24' }), cx, H + 0.16, cz + 0.035, L - 0.06, 0.3, 0);
  addSign(ctx.scene, textPlate('Weihnachtsgebäck', { w: 1024, h: 200, bg: '#a61d24' }), cx, H + 0.16, cz - 0.035, L - 0.06, 0.3, Math.PI);
  col.box(cx - L / 2, cz - D, cx + L / 2, cz + D, 'display');
  ps.blocker([cx - L / 2, 0, cz - 0.03, cx + L / 2, H, cz + 0.03]);
  const half = Math.ceil(products.length / 2);
  sides.forEach((s, i) => {
    ps.begin('season-' + i);
    stockShelf(ctx, s, levels.map((l) => ({ ...l, tagY: l.y - 0.06 })), ['saison'], { maxDepth: 2 });
    ps.end();
  });
}

function buildTills(ctx, out) {
  const { fix, glow, col, ps, scene, data } = ctx;
  const C = CHECKOUT;
  const beltTex = beltTexture();
  out.beltTex = beltTex;
  const beltMat = new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.9 });
  for (const lane of LANES) {
    const [b0, b1] = lane.booth, [c0, c1] = lane.counter, [l0, l1] = lane.lane;
    // booth: desk with a gap for the cashier's chair
    fix.color('#dde1e4');
    fix.boxMM(b0, 0, C.z0, b1, 0.85, 8.9);
    fix.boxMM(b0, 0, 9.95, b1, 0.85, C.z1);
    fix.color('#c9ced2');
    fix.boxMM(b0, 0, 8.9, b0 + 0.06, 1.15, 9.95);
    // counter body
    fix.color('#e7eaec');
    fix.boxMM(c0, 0, C.z0, c1, C.counterH, C.bayZ0);
    fix.color(AMEK.petrol);
    fix.boxMM(c0, 0.1, C.z0 - 0.01, c1, C.counterH - 0.05, C.z0);
    fix.boxMM(c1, 0.1, C.z0, c1 + 0.005, 0.3, C.z1);
    // bagging bay, lower with a lip
    fix.color('#cfd4d8');
    fix.boxMM(c0, 0, C.bayZ0, c1, 0.7, C.z1);
    fix.color('#b2b8bd');
    fix.boxMM(c0, 0.7, C.bayZ0, c0 + 0.04, 0.82, C.z1);
    fix.boxMM(c1 - 0.04, 0.7, C.bayZ0, c1, 0.82, C.z1);
    fix.boxMM(c0, 0.7, C.z1 - 0.04, c1, 0.82, C.z1);
    // scanner window
    fix.color('#26292c');
    fix.boxMM(c0 + 0.08, C.counterH, C.scanZ - 0.16, c1 - 0.08, C.counterH + 0.005, C.scanZ + 0.16);
    glow.color(lane.open ? '#ff4d4d' : '#3a1515');
    glow.boxMM(c0 + 0.2, C.counterH + 0.006, C.scanZ - 0.08, c1 - 0.2, C.counterH + 0.008, C.scanZ + 0.08);
    // belt
    const belt = new THREE.Mesh(new THREE.PlaneGeometry(c1 - c0 - 0.1, C.beltZ1 - C.beltZ0), beltMat);
    belt.rotation.x = -Math.PI / 2;
    belt.position.set((c0 + c1) / 2, C.counterH + 0.004, (C.beltZ0 + C.beltZ1) / 2);
    scene.add(belt);
    // till & customer display
    fix.color('#2b2e31');
    fix.boxMM(b0 + 0.15, 0.85, 9.0, b0 + 0.6, 1.2, 9.15);
    fix.boxMM(c1 - 0.02, 0.82, 9.28, c1 + 0.04, 1.02, 9.34);
    fix.color('#1a1c1e');
    fix.boxMM(c1 - 0.04, 1.0, 9.22, c1 + 0.08, 1.06, 9.4);
    glow.color(lane.open ? '#9fe0ff' : '#222');
    glow.boxMM(c1 + 0.08, 1.01, 9.25, c1 + 0.085, 1.05, 9.37);
    // lane number on a pole
    fix.color('#7b8288');
    fix.boxMM(b0 + 0.08, 0.85, C.z0 + 0.1, b0 + 0.13, 2.3, C.z0 + 0.15);
    const texOpen = tex(laneSign(lane.n, true)), texClosed = tex(laneSign(lane.n, false));
    const signs = [0, Math.PI].map((r) => addSign(scene, lane.open ? laneSign(lane.n, true) : laneSign(lane.n, false), b0 + 0.105, 2.45, C.z0 + 0.125 + (r ? -0.03 : 0.03), 0.42, 0.42, r));
    // collisions: booth + counter as one block
    col.box(b0, C.z0, c1, C.z1, 'till');
    // a barrier across the lane mouth while the till is closed
    const barrier = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(l1 - l0, 0.05, 0.03), new THREE.MeshStandardMaterial({ color: '#c8102e' }));
    bar.position.set((l0 + l1) / 2, 0.875, C.z0 - 0.015);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.92, 0.05), new THREE.MeshStandardMaterial({ color: '#9aa1a8' }));
    post.position.set(l1 - 0.025, 0.46, C.z0 - 0.025);
    barrier.add(bar, post);
    scene.add(barrier);
    const barrierCol = col.box(l0, C.z0 - 0.08, l1, C.z0 + 0.02, 'barrier');
    const setOpen = (open) => {
      for (const s of signs) s.material.map = open ? texOpen : texClosed;
      barrier.visible = !open;
      barrierCol.on = !open;
    };
    setOpen(lane.open);
    // impulse rack on the east side of the lane
    const rx1 = lane.n === LANES.length ? LANE_END_CAP[0] : LANES[lane.n].booth[0];
    const rack = new Side(rx1, C.z0 + 0.05, -Math.PI / 2, 1.2, 0.2);
    fix.color('#dde1e4');
    rack.box(fix, 0, 1.2, 0, 1.25, 0.17, 0.2);
    const lv = [{ y: 0.35, clear: 0.2 }, { y: 0.62, clear: 0.2 }, { y: 0.89, clear: 0.2 }];
    for (const l of lv) {
      fix.color('#c9ced2');
      rack.box(fix, 0, 1.2, l.y - 0.015, l.y, 0, 0.18);
    }
    const rr = rack.rect(0, 1.2, 0, 0.2);
    col.box(rr[0], rr[1], rr[2], rr[3], 'rack');
    ps.blocker(rack.aabb(0, 1.2, 0, 1.25, 0.17, 0.2));
    ps.begin('rack-' + lane.n);
    stockShelf(ctx, rack, lv.map((l) => ({ ...l, tagY: l.y - 0.055 })), ['kasse'], { maxDepth: 2 });
    ps.end();
    out.lanes.push({ ...lane, belt, beltX: (c0 + c1) / 2, beltW: c1 - c0 - 0.12, cashierX: (b0 + b1) / 2 + 0.1, terminal: { x: c1 + 0.06, y: 1.05, z: 9.3 }, setOpen });
  }
  // end cap of the last lane
  fix.color('#dde1e4');
  fix.boxMM(LANE_END_CAP[0], 0, CHECKOUT.z0, LANE_END_CAP[1], 0.85, CHECKOUT.z1);
  col.box(LANE_END_CAP[0], CHECKOUT.z0, LANE_END_CAP[1], CHECKOUT.z1, 'till');
  // packing table along the window
  fix.color('#b9c0c6');
  fix.boxMM(-9.5, 0, 12.35, -5.5, 0.85, 12.95);
  fix.color('#e7eaec');
  fix.boxMM(-9.55, 0.85, 12.3, -5.45, 0.88, 13.0);
  col.box(-9.55, 12.3, -5.45, 13.0, 'table');
  addSign(scene, textPlate('Packtisch', { w: 512, h: 96 }), -7.5, 1.3, 12.97, 1.1, 0.2, Math.PI);
}

function buildPfand(ctx, out) {
  const { fix, glow, col, scene } = ctx;
  const x = PFAND.x, z = PFAND.z;
  fix.color('#e9ecef');
  fix.boxMM(x, 0, z - 0.55, x + 0.7, 1.95, z + 0.55);
  fix.color(AMEK.petrol);
  fix.boxMM(x - 0.01, 1.6, z - 0.55, x, 1.95, z + 0.55);
  fix.color('#1a1c1e');
  fix.boxMM(x - 0.015, 0.95, z - 0.14, x, 1.23, z + 0.14); // bottle opening frame
  glow.color('#ffe9a8');
  glow.boxMM(x - 0.02, 1.0, z - 0.1, x - 0.015, 1.18, z + 0.1);
  glow.color('#8fd3ff');
  glow.boxMM(x - 0.012, 1.3, z + 0.18, x - 0.005, 1.48, z + 0.42); // screen
  fix.color('#2e9d4a');
  fix.boxMM(x - 0.03, 1.32, z - 0.35, x, 1.38, z - 0.25); // Bon button
  col.box(x, z - 0.55, x + 0.7, z + 0.55, 'pfand');
  addSign(scene, textPlate('Leergut', { w: 512, h: 128, bg: AMEK.petrol }), x - 0.02, 1.78, z, 0.9, 0.22, -Math.PI / 2);
  out.pfand = { x: x - 0.3, z, face: { x: x - 0.02, y: 1.1, z } };
}

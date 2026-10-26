// Low-poly models: shopping cart, cars, people. Forward is -z for everything
// that moves, so rotation.y = yaw lines them up with the player's view.
import * as THREE from '../../vendor/three.module.min.js';
import { GeoBuilder, vcMat } from './geo.js';
import { wireTexture, AMEK, canvas, tex, drawLogo } from './textures.js';

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...opts });
    matCache.set(key, m);
  }
  return m;
}

// ---------------------------------------------------------------------------
// Shopping cart. Origin on the ground under the middle of the basket.
export const CART = {
  length: 0.95,
  width: 0.56,
  basket: { x0: -0.21, x1: 0.21, z0: -0.4, z1: 0.36, y: 0.52, top: 0.92 },
  tray: { x0: -0.19, x1: 0.19, z0: -0.33, z1: 0.28, y: 0.2, top: 0.47 },
  handleZ: 0.52,
};

let wireMat = null, cartGeo = null, handleGeo = null;

export function makeCart() {
  if (!wireMat) {
    wireMat = new THREE.MeshStandardMaterial({ map: wireTexture(), alphaTest: 0.45, side: THREE.DoubleSide, color: '#e6eaee', metalness: 0.55, roughness: 0.35 });
    const B = new GeoBuilder({ uv: true });
    const bx = 0.25, fx = 0.22, z0 = -0.47, z1 = 0.42, y0 = CART.basket.y - 0.02, y1 = CART.basket.top;
    // basket panels (front narrower than back), uv in metres so the grid is even
    B.quad([-fx, y0, z0], [-bx, y0, z1], [bx, y0, z1], [fx, y0, z0], { u0: 0, v0: 0, u1: 0.5, v1: 1.8 });
    B.quad([-fx, y0, z0], [fx, y0, z0], [fx, y1, z0 - 0.05], [-fx, y1, z0 - 0.05], { u0: 0, v0: 0, u1: 0.9, v1: 0.8 });
    B.quad([bx, y0, z1], [-bx, y0, z1], [-bx, y1, z1 + 0.04], [bx, y1, z1 + 0.04], { u0: 0, v0: 0, u1: 1, v1: 0.8 });
    B.quad([-bx, y0, z1], [-fx, y0, z0], [-fx, y1, z0 - 0.05], [-bx, y1, z1 + 0.04], { u0: 0, v0: 0, u1: 1.8, v1: 0.8 });
    B.quad([fx, y0, z0], [bx, y0, z1], [bx, y1, z1 + 0.04], [fx, y1, z0 - 0.05], { u0: 0, v0: 0, u1: 1.8, v1: 0.8 });
    // bottom tray
    B.quad([-0.2, 0.19, -0.36], [-0.2, 0.19, 0.3], [0.2, 0.19, 0.3], [0.2, 0.19, -0.36], { u0: 0, v0: 0, u1: 0.8, v1: 1.3 });
    cartGeo = B.build();
    const H = new GeoBuilder({ uv: false, color: true });
    H.color('#c3c9cf');
    // rim tubes
    H.boxMM(-fx - 0.012, y1 - 0.015, z0 - 0.06, fx + 0.012, y1 + 0.01, z0 - 0.035);
    H.boxMM(-bx - 0.012, y1 - 0.015, z1 + 0.03, bx + 0.012, y1 + 0.01, z1 + 0.055);
    H.boxMM(-bx - 0.015, y1 - 0.015, z0 - 0.05, -bx + 0.01, y1 + 0.01, z1 + 0.05);
    H.boxMM(bx - 0.01, y1 - 0.015, z0 - 0.05, bx + 0.015, y1 + 0.01, z1 + 0.05);
    // chassis
    H.boxMM(-0.23, 0.12, -0.42, -0.2, 0.15, 0.45);
    H.boxMM(0.2, 0.12, -0.42, 0.23, 0.15, 0.45);
    H.boxMM(-0.23, 0.12, -0.45, 0.23, 0.15, -0.42);
    for (const sx of [-1, 1]) {
      H.boxMM(sx * 0.235 - 0.012, 0.12, 0.43, sx * 0.235 + 0.012, 1.0, 0.455);
      H.boxMM(sx * 0.2 - 0.01, 0.15, -0.38, sx * 0.2 + 0.01, y0, -0.36);
    }
    // handle and coin lock
    H.color(AMEK.petrol);
    H.boxMM(-0.27, 0.98, 0.5, 0.27, 1.025, 0.545);
    H.color(AMEK.amber);
    H.boxMM(-0.05, 0.94, 0.46, 0.05, 1.035, 0.53);
    H.color('#2b2b2b');
    H.boxMM(-0.012, 1.0, 0.452, 0.012, 1.02, 0.46);
    for (const [x, z] of [[-0.2, -0.4], [0.2, -0.4], [-0.21, 0.42], [0.21, 0.42]]) {
      H.color('#3a3d40');
      H.boxMM(x - 0.02, 0.0, z - 0.04, x + 0.02, 0.09, z + 0.04);
      H.color('#9aa1a8');
      H.boxMM(x - 0.008, 0.08, z - 0.008, x + 0.008, 0.13, z + 0.008);
    }
    handleGeo = H.build();
  }
  const g = new THREE.Group();
  const wire = new THREE.Mesh(cartGeo, wireMat);
  const frame = new THREE.Mesh(handleGeo, vcMat({ metalness: 0.4, roughness: 0.4 }));
  wire.castShadow = frame.castShadow = true;
  g.add(wire, frame);
  const contents = new THREE.Group();
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Nested carts in the corral, as one static mesh.
export function cartStackInto(group, n, spacing = 0.28) {
  for (let i = 0; i < n; i++) {
    const c = makeCart();
    c.position.z = i * spacing;
    c.position.y = i * 0.003;
    group.add(c);
  }
}

// ---------------------------------------------------------------------------
// Cars. Station wagon, 4.6 m. Built into shared builders so the parked cars
// in the lot cost one draw call.
export const CAR = { length: 4.6, width: 1.8, wheelbase: 2.7 };

export function carInto(B, G, Lt, color, m, { lidOpen = 0, skipLid = false } = {}) {
  const old = B.m, oldG = G.m, oldL = Lt.m;
  B.m = m; G.m = m; Lt.m = m;
  const paint = color, trim = '#2a2c2f';
  B.color(paint);
  B.boxMM(-0.89, 0.34, -2.2, 0.89, 0.88, 2.2);
  B.boxMM(-0.86, 0.88, -2.2, 0.86, 0.95, -0.95);
  B.color(trim);
  B.boxMM(-0.88, 0.24, -2.32, 0.88, 0.5, -2.15);
  B.boxMM(-0.88, 0.24, 2.15, 0.88, 0.5, 2.32);
  B.boxMM(-0.9, 0.28, -1.65, 0.9, 0.45, 1.75);
  B.color('#f0f0f0');
  B.boxMM(-0.26, 0.35, -2.335, 0.26, 0.47, -2.32);
  B.boxMM(-0.26, 0.55, 2.32, 0.26, 0.67, 2.335);
  // cabin
  const zA = -0.95, zW = -0.25, zR = 1.95, zT = 2.18, yB = 0.95, yR = 1.45;
  B.color(paint);
  B.quad([-0.8, yR, zR], [0.8, yR, zR], [0.8, yR, zW], [-0.8, yR, zW], [0, 0]);
  for (const sx of [-1, 1]) {
    const x = sx * 0.84;
    // pillars
    B.boxMM(x - 0.03, yB, zA, x + 0.03, yB + 0.05, zT);
    B.boxMM(x - 0.03, yB, 0.75, x + 0.03, yR, 0.83);
  }
  G.color('#1c2630');
  // side windows
  for (const sx of [-1, 1]) {
    const x = sx * 0.835;
    const pts = [[zA, yB], [zT, yB], [zR, yR], [zW, yR]];
    const P = pts.map(([z, y]) => [x, y, z]);
    if (sx > 0) G.quad(P[1], P[0], P[3], P[2], [0, 0]);
    else G.quad(P[0], P[1], P[2], P[3], [0, 0]);
  }
  G.quad([0.84, yB, zA], [-0.84, yB, zA], [-0.8, yR, zW], [0.8, yR, zW], [0, 0]); // windscreen
  if (!skipLid) {
    G.quad([-0.84, yB, zT], [0.84, yB, zT], [0.8, yR, zR], [-0.8, yR, zR], [0, 0]); // rear window
  }
  Lt.color('#fffbe8');
  Lt.boxMM(-0.84, 0.66, -2.215, -0.5, 0.78, -2.195);
  Lt.boxMM(0.5, 0.66, -2.215, 0.84, 0.78, -2.195);
  Lt.color('#c4161c');
  Lt.boxMM(-0.86, 0.7, 2.195, -0.58, 0.86, 2.215);
  Lt.boxMM(0.58, 0.7, 2.195, 0.86, 0.86, 2.215);
  // wheels
  B.color('#1a1a1a');
  const wm = new THREE.Matrix4();
  for (const [x, z] of [[-0.8, -1.35], [0.8, -1.35], [-0.8, 1.35], [0.8, 1.35]]) {
    wm.copy(m).multiply(new THREE.Matrix4().makeTranslation(x, 0.33, z)).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
    B.m = wm;
    B.cylinder(0, -0.12, 0, 0.33, 0.24, 12);
    B.color('#a9adb1');
    B.cylinder(0, -0.125, 0, 0.2, 0.25, 8);
    B.color('#1a1a1a');
  }
  B.m = old; G.m = oldG; Lt.m = oldL;
}

export function makeCar(color = '#2f5d8a') {
  const B = new GeoBuilder({ uv: false, color: true });
  const G = new GeoBuilder({ uv: false, color: true });
  const Lt = new GeoBuilder({ uv: false, color: true });
  carInto(B, G, Lt, color, new THREE.Matrix4(), { skipLid: true });
  const group = new THREE.Group();
  const body = new THREE.Mesh(B.build(), vcMat({ roughness: 0.35, metalness: 0.3 }));
  const glass = new THREE.Mesh(G.build(), vcMat({ roughness: 0.1, metalness: 0.6, side: THREE.DoubleSide }));
  const lights = new THREE.Mesh(Lt.build(), vcMat({ emissive: '#ffffff', emissiveIntensity: 0.25 }));
  body.castShadow = glass.castShadow = true;
  group.add(body, glass, lights);
  // tailgate on a hinge at the back of the roof
  const lid = new THREE.Group();
  lid.position.set(0, 1.45, 1.95);
  const LB = new GeoBuilder({ uv: false, color: true });
  LB.color('#1c2630');
  LB.quad([0.84, 0.95 - 1.45, 2.18 - 1.95], [-0.84, 0.95 - 1.45, 2.18 - 1.95], [-0.8, 0, 0], [0.8, 0, 0], [0, 0]);
  LB.color(color);
  LB.boxMM(-0.86, -0.52, 0.22, 0.86, -0.47, 0.27);
  const lidMesh = new THREE.Mesh(LB.build(), vcMat({ roughness: 0.2, metalness: 0.5, side: THREE.DoubleSide }));
  lidMesh.castShadow = true;
  lid.add(lidMesh);
  group.add(lid);
  // the boot: loaded shopping goes here
  const boot = new THREE.Group();
  boot.position.set(0, 0.62, 1.55);
  group.add(boot);
  // number plate
  const plate = canvas(256, 56);
  const pg = plate.getContext('2d');
  pg.fillStyle = '#ffffff';
  pg.fillRect(0, 0, 256, 56);
  pg.fillStyle = '#1d4fa0';
  pg.fillRect(0, 0, 26, 56);
  pg.fillStyle = '#111';
  pg.font = '700 38px "Archivo Narrow", Arial, sans-serif';
  pg.textAlign = 'center';
  pg.textBaseline = 'middle';
  pg.fillText('MS · AK 2026', 142, 30);
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.115), new THREE.MeshStandardMaterial({ map: tex(plate), roughness: 0.4 }));
  pm.position.set(0, 0.61, 2.34);
  group.add(pm);
  const pm2 = pm.clone();
  pm2.position.set(0, 0.41, -2.34);
  pm2.rotation.y = Math.PI;
  group.add(pm2);
  group.userData = { lid, boot, lights };
  return group;
}

// ---------------------------------------------------------------------------
// People
export function makePerson({ shirt = '#3a6ea5', pants = '#2b2f3a', skin = '#e0b48f', hair = '#3b2a1e', sitting = false, logo = false, tall = 1 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(tall);
  g.add(body);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.24), mat(shirt));
  torso.position.y = 1.17;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 9), mat(skin));
  head.position.y = 1.6;
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.122, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair));
  hairM.position.y = 1.62;
  hairM.rotation.x = -0.25;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.09), mat(skin));
  neck.position.y = 1.47;
  body.add(torso, head, hairM, neck);
  if (logo) {
    const c = canvas(128, 64);
    drawLogo(c.getContext('2d'), 0, 0, 128, 64);
    const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.07), new THREE.MeshStandardMaterial({ map: tex(c) }));
    lg.position.set(0.09, 1.3, -0.121);
    lg.rotation.y = Math.PI;
    body.add(lg);
  }
  const limb = (w, h, color, x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat(color));
    m.position.y = -h / 2;
    m.castShadow = true;
    pivot.add(m);
    body.add(pivot);
    return pivot;
  };
  const legL = limb(0.16, 0.88, pants, -0.1, 0.9);
  const legR = limb(0.16, 0.88, pants, 0.1, 0.9);
  const armL = limb(0.1, 0.6, shirt, -0.27, 1.43);
  const armR = limb(0.1, 0.6, shirt, 0.27, 1.43);
  for (const m of [torso, head]) m.castShadow = true;
  if (sitting) {
    legL.rotation.x = legR.rotation.x = Math.PI / 2;
    body.position.y = -0.38;
    armL.rotation.x = armR.rotation.x = 0.9;
  }
  g.userData = { legL, legR, armL, armR, body, phase: Math.random() * 6 };
  return g;
}

export function animateWalk(person, speed, dt) {
  const u = person.userData;
  u.phase += dt * speed * 5.5;
  const a = Math.sin(u.phase) * Math.min(0.6, speed * 0.45);
  u.legL.rotation.x = a;
  u.legR.rotation.x = -a;
  if (!u.pushing) {
    u.armL.rotation.x = -a * 0.8;
    u.armR.rotation.x = a * 0.8;
  }
  u.body.position.y = Math.abs(Math.sin(u.phase)) * 0.02 * Math.min(1, speed);
}

// ---------------------------------------------------------------------------
// A cheaper person for crowds: head and torso are one mesh, limbs share geometry.
const limbGeo = { leg: new THREE.BoxGeometry(0.16, 0.88, 0.16).translate(0, -0.44, 0), arm: new THREE.BoxGeometry(0.1, 0.6, 0.1).translate(0, -0.3, 0) };
let liteMat = null;

export function makeLitePerson({ shirt = '#3a6ea5', pants = '#2b2f3a', skin = '#e0b48f', hair = '#3b2a1e', tall = 1, apron = null } = {}) {
  liteMat = liteMat || vcMat({ roughness: 0.75 });
  const B = new GeoBuilder({ uv: false, color: true });
  B.color(shirt);
  B.boxMM(-0.21, 0.89, -0.12, 0.21, 1.45, 0.12);
  if (apron) {
    B.color(apron);
    B.boxMM(-0.17, 0.75, -0.125, 0.17, 1.3, -0.12);
  }
  B.color(skin);
  B.boxMM(-0.045, 1.44, -0.045, 0.045, 1.52, 0.045);
  B.ellipsoid(0, 1.6, 0, 0.11, 0.12, 0.11, [0, 0], 8, 6);
  B.color(hair);
  B.ellipsoid(0, 1.65, 0.02, 0.118, 0.09, 0.118, [0, 0], 8, 4);
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(tall);
  g.add(body);
  const core = new THREE.Mesh(B.build(), liteMat);
  core.castShadow = true;
  body.add(core);
  const limb = (geo, color, x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = new THREE.Mesh(geo, mat(color));
    m.castShadow = true;
    pivot.add(m);
    body.add(pivot);
    return pivot;
  };
  const legL = limb(limbGeo.leg, pants, -0.1, 0.9);
  const legR = limb(limbGeo.leg, pants, 0.1, 0.9);
  const armL = limb(limbGeo.arm, shirt, -0.27, 1.43);
  const armR = limb(limbGeo.arm, shirt, 0.27, 1.43);
  g.userData = { legL, legR, armL, armR, body, phase: Math.random() * 6 };
  return g;
}

export function poseSitting(p, on) {
  const u = p.userData;
  u.legL.rotation.x = u.legR.rotation.x = on ? Math.PI / 2 : 0;
  u.body.position.y = on ? -0.38 : 0;
  u.armL.rotation.x = u.armR.rotation.x = on ? 0.9 : 0;
}

export function posePushing(p, on) {
  const u = p.userData;
  u.pushing = on;
  u.armL.rotation.x = u.armR.rotation.x = on ? -1.0 : 0;
}

// ---------------------------------------------------------------------------
// The delivery truck: 9 m rigid lorry in AMEK livery. Forward is -z.
export const TRUCK = { length: 9.0, width: 2.5 };

export function makeTruck() {
  const B = new GeoBuilder({ uv: false, color: true });
  const G = new GeoBuilder({ uv: false, color: true });
  const L = 4.5;
  // chassis and bumpers
  B.color('#26292c');
  B.boxMM(-1.15, 0.45, -L, 1.15, 1.0, L);
  // cab
  B.color('#f4f5f3');
  B.boxMM(-1.2, 1.0, -L, 1.2, 3.1, -2.55);
  B.color(AMEK.petrol);
  B.boxMM(-1.21, 1.0, -L - 0.01, 1.21, 1.45, -2.55);
  B.color('#26292c');
  B.boxMM(-1.18, 0.5, -L - 0.08, 1.18, 0.95, -L + 0.1);
  G.color('#1c2630');
  G.quad([1.1, 1.9, -L - 0.005], [-1.1, 1.9, -L - 0.005], [-1.1, 2.9, -L - 0.005], [1.1, 2.9, -L - 0.005], [0, 0]);
  for (const sx of [-1, 1]) G.boxMM(sx * 1.205 - 0.005, 1.9, -L + 0.2, sx * 1.205 + 0.005, 2.8, -L + 1.1);
  // box body
  B.color('#f7f8f7');
  B.boxMM(-1.25, 1.0, -2.45, 1.25, 3.7, L);
  B.color(AMEK.petrol);
  B.boxMM(-1.26, 1.0, -2.45, 1.26, 1.3, L + 0.01);
  B.color('#b9bec2');
  B.boxMM(-1.2, 1.05, L, 1.2, 3.6, L + 0.03);
  // wheels: steer axle and double rear axle
  B.color('#1a1a1a');
  const wm = new THREE.Matrix4();
  for (const z of [-3.4, 2.2, 3.4]) {
    for (const sx of [-1, 1]) {
      wm.makeTranslation(sx * 1.0, 0.5, z).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
      B.m = wm;
      B.cylinder(0, -0.16, 0, 0.5, 0.32, 12);
      B.m = null;
    }
  }
  const group = new THREE.Group();
  const body = new THREE.Mesh(B.build(), vcMat({ roughness: 0.5, metalness: 0.1 }));
  const glass = new THREE.Mesh(G.build(), vcMat({ roughness: 0.1, metalness: 0.6, side: THREE.DoubleSide }));
  body.castShadow = glass.castShadow = true;
  group.add(body, glass);
  // livery on both sides of the box
  const lc = canvas(1024, 384);
  const g = lc.getContext('2d');
  g.fillStyle = '#f7f8f7';
  g.fillRect(0, 0, 1024, 384);
  drawLogo(g, 40, 70, 420, 210);
  g.fillStyle = AMEK.petrol;
  g.font = '800 64px "Archivo", Arial, sans-serif';
  g.fillText('Frisch. Günstig.', 500, 160);
  g.fillStyle = '#c98900';
  g.fillText('Um die Ecke.', 500, 240);
  const lt = tex(lc);
  for (const sx of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 2.4), new THREE.MeshStandardMaterial({ map: lt, roughness: 0.6 }));
    p.position.set(sx * 1.262, 2.45, 1.0);
    p.rotation.y = (sx * Math.PI) / 2;
    group.add(p);
  }
  const lights = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.04), new THREE.MeshStandardMaterial({ color: '#fffbe8', emissive: '#fffbe8', emissiveIntensity: 0.3 }));
  lights.position.set(0, 0.8, -L - 0.09);
  group.add(lights);
  group.userData = { lights };
  return group;
}

// Roll cage (Rollcontainer) with boxed stock; fill 0..1 sets how full it looks.
let cageMat = null;
export function makeRollCage(fill = 1) {
  if (!cageMat) cageMat = new THREE.MeshStandardMaterial({ map: wireTexture(), alphaTest: 0.45, side: THREE.DoubleSide, color: '#c9ced3', metalness: 0.5, roughness: 0.4 });
  const g = new THREE.Group();
  const W = 0.72, D = 0.82, H = 1.65;
  const wire = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), cageMat);
  wire.position.y = 0.12 + H / 2;
  g.add(wire);
  const B = new GeoBuilder({ uv: false, color: true });
  B.color('#4b5157');
  B.boxMM(-W / 2, 0.08, -D / 2, W / 2, 0.14, D / 2);
  for (const [x, z] of [[-0.3, -0.34], [0.3, -0.34], [-0.3, 0.34], [0.3, 0.34]]) B.boxMM(x - 0.03, 0, z - 0.03, x + 0.03, 0.09, z + 0.03);
  const cols = ['#c8a477', '#b38e5f', '#d9b98a', '#2f6fb5', '#c0392b', '#2e7d32', '#f2c230'];
  const layers = Math.round(4 * fill);
  for (let l = 0; l < layers; l++) {
    for (let k = 0; k < 4; k++) {
      B.color(cols[(l * 3 + k) % cols.length]);
      const x = (k % 2) * 0.34 - 0.33, z = Math.floor(k / 2) * 0.39 - 0.38;
      B.boxMM(x + 0.01, 0.15 + l * 0.36, z + 0.01, x + 0.32, 0.47 + l * 0.36, z + 0.37);
    }
  }
  const box = new THREE.Mesh(B.build(), vcMat({ roughness: 0.8 }));
  box.castShadow = true;
  g.add(box);
  return g;
}

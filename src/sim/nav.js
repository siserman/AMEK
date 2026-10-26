// Walking network for simulated people: aisles, cross aisles, till lanes, the
// doors, the pavement and the backroom, as straight corridors. Shortest paths
// between all junctions are precomputed; any point (a shelf slot, a parking bay)
// joins the network where it projects onto the nearest corridor.
import { LANES } from '../world/layout.js';

const laneX = (l) => (l.lane[0] + l.lane[1]) / 2;
const EPS = 0.03;

export const NAV = {
  sidewalkZ: 15.4,
  lotFrontZ: 17.8,
  corralMouth: { x: 20.6, z: 17.35 },
  staging: { x: 21.0, z: -11.0 },
  annex: { x: 21.0, z: -4.0 },
  dockIn: { x: 23.0, z: -8.0 },
  streetWest: { x: -45, z: 44.6 },
  streetEast: { x: 70, z: 44.6 },
};

export class Nav {
  constructor() {
    this.nodes = [];
    this.edges = [];
    const V = [
      // x, z0, z1, kind
      [-9.45, -11.0, 5.0, 'shop'], [-5.8, -11.0, 1.6, 'shop'], [-1.6, -11.0, 1.6, 'shop'], [1.8, -11.0, 1.6, 'shop'],
      [5.2, -11.0, 5.0, 'shop'], [8.6, -11.0, 1.6, 'shop'], [12.0, -11.0, 8.2, 'shop'], [15.85, -11.0, 8.2, 'shop'],
      [-2.8, 1.6, 5.0, 'path'],
      ...LANES.map((l) => [laneX(l), 5.0, 11.6, 'lane']),
      [4.5, 11.6, NAV.lotFrontZ, 'path'],
      [15.5, 12.3, NAV.sidewalkZ, 'path'],
      [18.6, NAV.sidewalkZ, NAV.lotFrontZ, 'walk'],
      [19.0, 0.0, NAV.sidewalkZ, 'staff'],
    ];
    const H = [
      // z, x0, x1, kind
      [-11.0, -9.45, 15.85, 'shop'], [1.6, -9.45, 12.0, 'shop'], [5.0, -9.45, 15.85, 'shop'], [8.2, 12.0, 15.85, 'shop'],
      [11.6, laneX(LANES[0]), 4.5, 'path'],
      [NAV.sidewalkZ, 4.5, 19.0, 'walk'],
      [NAV.lotFrontZ, -22.5, 24.0, 'walk'],
    ];
    const chains = [
      [[[15.85, 8.2], [15.5, 9.9], [15.5, 12.3]], 'path'],
      [[[15.5, 12.3], [16.6, 12.0]], 'path'],
      [[[15.85, -8.6], [17.4, -8.6], [19.0, -8.6], [21.0, -8.6]], 'staff'],
      [[[21.0, -8.6], [21.0, -4.0], [19.5, -3.0], [19.5, -1.2], [19.0, 0.0]], 'staff'],
      [[[21.0, -8.6], [NAV.dockIn.x, NAV.dockIn.z]], 'staff'],
      [[[21.0, -8.6], [NAV.staging.x, NAV.staging.z]], 'staff'],
      [[[NAV.corralMouth.x, NAV.lotFrontZ], [NAV.corralMouth.x, NAV.corralMouth.z]], 'walk'],
      [[[24.0, NAV.lotFrontZ], [25.6, 19.0], [25.6, 44.6]], 'walk'],
      [[[NAV.streetWest.x, 44.6], [25.6, 44.6], [NAV.streetEast.x, 44.6]], 'walk'],
    ];
    // points that must be junctions: intersections, the staff-door branch, every bay boundary
    const extra = [[15.85, -8.6], [NAV.corralMouth.x, NAV.lotFrontZ]];
    for (let k = 0; k <= 18; k++) extra.push([-22.5 + k * 2.5, NAV.lotFrontZ]);
    const lines = [
      ...V.map(([x, z0, z1, kind]) => ({ v: true, x, z0, z1, kind, pts: [[x, z0], [x, z1]] })),
      ...H.map(([z, x0, x1, kind]) => ({ v: false, z, x0, x1, kind, pts: [[x0, z], [x1, z]] })),
    ];
    for (const a of lines) {
      if (!a.v) continue;
      for (const b of lines) {
        if (b.v) continue;
        if (b.z >= a.z0 - EPS && b.z <= a.z1 + EPS && a.x >= b.x0 - EPS && a.x <= b.x1 + EPS) {
          a.pts.push([a.x, b.z]);
          b.pts.push([a.x, b.z]);
        }
      }
    }
    for (const [px, pz] of [...extra, ...chains.flatMap(([c]) => c)]) {
      for (const l of lines) {
        if (l.v ? Math.abs(px - l.x) < EPS && pz >= l.z0 - EPS && pz <= l.z1 + EPS : Math.abs(pz - l.z) < EPS && px >= l.x0 - EPS && px <= l.x1 + EPS) l.pts.push([px, pz]);
      }
    }
    for (const l of lines) {
      const ids = [...new Set(l.pts.map(([x, z]) => this.node(x, z)))];
      ids.sort((i, j) => (l.v ? this.nodes[i].z - this.nodes[j].z : this.nodes[i].x - this.nodes[j].x));
      for (let i = 1; i < ids.length; i++) this.edge(ids[i - 1], ids[i], l.kind);
    }
    for (const [pts, kind] of chains) {
      for (let i = 1; i < pts.length; i++) this.edge(this.node(...pts[i - 1]), this.node(...pts[i]), kind);
    }
    this.solve();
  }

  node(x, z) {
    for (let i = 0; i < this.nodes.length; i++) if (Math.abs(this.nodes[i].x - x) < EPS && Math.abs(this.nodes[i].z - z) < EPS) return i;
    this.nodes.push({ x, z });
    return this.nodes.length - 1;
  }

  edge(a, b, kind) {
    if (a === b || this.edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))) return;
    const A = this.nodes[a], B = this.nodes[b];
    this.edges.push({ a, b, kind, len: Math.hypot(B.x - A.x, B.z - A.z) });
  }

  // Floyd–Warshall: a few hundred junctions, done once
  solve() {
    const n = this.nodes.length;
    const d = (this.dist = Array.from({ length: n }, () => new Float64Array(n).fill(Infinity)));
    const nx = (this.next = Array.from({ length: n }, () => new Int32Array(n).fill(-1)));
    for (let i = 0; i < n; i++) {
      d[i][i] = 0;
      nx[i][i] = i;
    }
    for (const e of this.edges) {
      d[e.a][e.b] = d[e.b][e.a] = e.len;
      nx[e.a][e.b] = e.b;
      nx[e.b][e.a] = e.a;
    }
    for (let k = 0; k < n; k++) {
      const dk = d[k];
      for (let i = 0; i < n; i++) {
        const di = d[i], dik = di[k];
        if (dik === Infinity) continue;
        const ni = nx[i];
        for (let j = 0; j < n; j++) {
          const v = dik + dk[j];
          if (v < di[j]) {
            di[j] = v;
            ni[j] = ni[k];
          }
        }
      }
    }
  }

  // Nearest point on the network. accept(edge, px, pz) may refuse edges.
  locate(x, z, accept) {
    let best = null, bd = Infinity;
    for (const e of this.edges) {
      const A = this.nodes[e.a], B = this.nodes[e.b];
      const dx = B.x - A.x, dz = B.z - A.z;
      const t = Math.max(0, Math.min(1, ((x - A.x) * dx + (z - A.z) * dz) / (dx * dx + dz * dz || 1)));
      const px = A.x + dx * t, pz = A.z + dz * t;
      if (accept && !accept(e, px, pz)) continue;
      const d = Math.hypot(px - x, pz - z);
      if (d < bd) {
        bd = d;
        best = { a: e.a, b: e.b, x: px, z: pz, d };
      }
    }
    return best;
  }

  at(x, z) {
    return this.locate(x, z);
  }

  // Polyline from one located point to another.
  path(from, to) {
    if (sameEdge(from, to)) return [{ x: from.x, z: from.z }, { x: to.x, z: to.z }];
    const starts = from.node !== undefined ? [[from.node, 0]] : [[from.a, this.d(from, from.a)], [from.b, this.d(from, from.b)]];
    const ends = to.node !== undefined ? [[to.node, 0]] : [[to.a, this.d(to, to.a)], [to.b, this.d(to, to.b)]];
    let best = null, bc = Infinity;
    for (const [s, sc] of starts)
      for (const [e, ec] of ends) {
        const c = sc + this.dist[s][e] + ec;
        if (c < bc) {
          bc = c;
          best = [s, e];
        }
      }
    const out = [{ x: from.x, z: from.z }];
    if (best) {
      let i = best[0];
      const j = best[1];
      for (let guard = 0; guard < 500; guard++) {
        out.push({ x: this.nodes[i].x, z: this.nodes[i].z });
        if (i === j) break;
        i = this.next[i][j];
        if (i < 0) break;
      }
    }
    out.push({ x: to.x, z: to.z });
    return dedupe(out);
  }

  length(from, to) {
    if (sameEdge(from, to)) return Math.hypot(from.x - to.x, from.z - to.z);
    const starts = from.node !== undefined ? [[from.node, 0]] : [[from.a, this.d(from, from.a)], [from.b, this.d(from, from.b)]];
    const ends = to.node !== undefined ? [[to.node, 0]] : [[to.a, this.d(to, to.a)], [to.b, this.d(to, to.b)]];
    let bc = Infinity;
    for (const [s, sc] of starts) for (const [e, ec] of ends) bc = Math.min(bc, sc + this.dist[s][e] + ec);
    return bc;
  }

  d(p, node) {
    const n = this.nodes[node];
    return Math.hypot(n.x - p.x, n.z - p.z);
  }

  nodeAt(x, z) {
    const i = this.nodes.findIndex((n) => Math.abs(n.x - x) < 0.05 && Math.abs(n.z - z) < 0.05);
    return i < 0 ? null : { node: i, x: this.nodes[i].x, z: this.nodes[i].z };
  }
}

function sameEdge(p, q) {
  return p.a !== undefined && q.a !== undefined && ((p.a === q.a && p.b === q.b) || (p.a === q.b && p.b === q.a));
}

function dedupe(pts) {
  const out = [];
  for (const p of pts) {
    const l = out[out.length - 1];
    if (!l || Math.hypot(l.x - p.x, l.z - p.z) > 0.02) out.push(p);
  }
  return out;
}

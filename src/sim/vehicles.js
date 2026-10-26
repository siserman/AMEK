// Cars and the delivery lorry: kinematic paths along the street, the access
// road and the car park aisle; parking nose-in and reversing out.
import { Agent, curve, cubic, P, join } from './agent.js';
import { ANNEX } from '../world/layout.js';

// lanes (drive on the right)
const EAST_Z = 51.2, WEST_Z = 47.8; // street
const NORTH_X = 30.2, SOUTH_X = 27.8; // access road
const AISLE_W = 25.4, AISLE_E = 27.6; // car park aisle (westbound, eastbound)
export const DOCKED = { x: ANNEX.x1 + 4.7, z: (ANNEX.dock.z0 + ANNEX.dock.z1) / 2 };

export function arrivePath(fromWest) {
  const street = fromWest
    ? join([P(-90, EAST_Z), P(24.5, EAST_Z)], curve(P(24.5, EAST_Z), P(NORTH_X, EAST_Z), P(NORTH_X, 45.5)))
    : join([P(95, WEST_Z), P(33.5, WEST_Z)], curve(P(33.5, WEST_Z), P(NORTH_X, WEST_Z), P(NORTH_X, 44.5)));
  return join(street, [P(NORTH_X, 29.2)], curve(P(NORTH_X, 29.2), P(NORTH_X, AISLE_W), P(26.4, AISLE_W)));
}

// from the aisle into a bay, nose first
export function parkPath(bay) {
  const bx = bay.x;
  if (bay.row === 0) return join([P(26.4, AISLE_W), P(bx + 3.2, AISLE_W)], curve(P(bx + 3.2, AISLE_W), P(bx, AISLE_W), P(bx, 22.6)), [P(bx, bay.z)]);
  return join([P(26.4, AISLE_W), P(bx + 3.2, AISLE_W)], curve(P(bx + 3.2, AISLE_W), P(bx, AISLE_W), P(bx, 28.4)), [P(bx, bay.z)]);
}

// reverse out of the bay until the car points east
export function unparkPath(bay) {
  const bx = bay.x;
  if (bay.row === 0) return join([P(bx, bay.z), P(bx, 23.4)], cubic(P(bx, 23.4), P(bx, 26.6), P(bx - 0.6, AISLE_E), P(bx - 3.0, AISLE_E)));
  return join([P(bx, bay.z), P(bx, 29.6)], cubic(P(bx, 29.6), P(bx, 26.4), P(bx - 0.6, 26.2), P(bx - 3.0, 26.4)));
}

export function leavePath(bay, toWest) {
  const start = bay.row === 0 ? P(bay.x - 3.0, AISLE_E) : P(bay.x - 3.0, 26.4);
  const lot = join([start, P(start.x + 3, AISLE_E), P(25.0, AISLE_E)], curve(P(25.0, AISLE_E), P(SOUTH_X, AISLE_E), P(SOUTH_X, 30.4)), [P(SOUTH_X, 44.5)]);
  const street = toWest
    ? join(curve(P(SOUTH_X, 44.5), P(SOUTH_X, WEST_Z), P(24.5, WEST_Z)), [P(-90, WEST_Z)])
    : join(curve(P(SOUTH_X, 44.5), P(SOUTH_X, EAST_Z), P(33.0, EAST_Z)), [P(95, EAST_Z)]);
  return join(lot, street);
}

export function truckIn() {
  return join(
    [P(110, WEST_Z), P(34.5, WEST_Z)],
    curve(P(34.5, WEST_Z), P(NORTH_X, WEST_Z), P(NORTH_X, 43.5)),
    [P(NORTH_X, 1.0)],
    curve(P(NORTH_X, 1.0), P(NORTH_X, -6.0), P(37.0, -6.0), 12)
  );
}
export function truckBack() {
  return cubic(P(37.0, -6.0), P(33.0, -6.0), P(32.2, DOCKED.z), P(DOCKED.x, DOCKED.z), 14);
}
export function truckOut() {
  return join(
    [P(DOCKED.x, DOCKED.z), P(35.0, DOCKED.z)],
    curve(P(35.0, DOCKED.z), P(39.0, DOCKED.z), P(39.0, -3.5)),
    cubic(P(39.0, -3.5), P(39.0, 3.0), P(SOUTH_X, 1.0), P(SOUTH_X, 8.0), 14),
    [P(SOUTH_X, 44.5)],
    curve(P(SOUTH_X, 44.5), P(SOUTH_X, WEST_Z), P(24.5, WEST_Z)),
    [P(-110, WEST_Z)]
  );
}

export class Vehicle extends Agent {
  constructor(sim, group) {
    super(sim);
    this.group = group;
    this.lid = 0;
    this.lidTarget = 0;
  }
  drive(pts, speed, reverse = false) {
    return this.walk(pts, speed, { reverse });
  }
  sync(dt) {
    this.group.position.set(this.x, 0, this.z);
    this.group.rotation.y = this.yaw;
    const lid = this.group.userData.lid;
    if (lid) {
      this.lid += (this.lidTarget - this.lid) * Math.min(1, dt * 4);
      lid.rotation.x = this.lid * 1.25;
    }
  }
}

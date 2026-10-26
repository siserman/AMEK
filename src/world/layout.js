// Where everything is. Metres, y up, the shop front faces +z (south) onto the
// car park. Inside the shop a shopper walks: entrance (front right) → fruit &
// veg → Backstation → chilled wall → aisles → freezer → drinks → tills → exit.
export const STORE = { x0: -11.8, x1: 18, z0: -13, z1: 13, h: 4.8, wall: 0.3 };

export const DOORS = {
  entry: { x: 15.5, w: 2.4 },
  exit: { x: 4.5, w: 2.4 },
};

// Entry turnstile and the railings that make the tills the only way out.
export const GATE = { x0: 14.8, x1: 16.2, z: 10.8 };
export const RAILS = [
  // [x0, z0, x1, z1]
  [-11.8, 9.0, -10.4, 9.05],
  [-1.6, 9.0, 12.5, 9.05],
  [12.45, 9.0, 12.5, 13.0],
  [12.5, 10.78, 14.8, 10.82],
  [16.2, 10.78, 18.0, 10.82],
];

export const CHECKOUT = { z0: 7.0, z1: 10.6, beltZ0: 7.05, beltZ1: 8.85, scanZ: 9.1, bayZ0: 9.5, bayZ1: 10.55, counterH: 0.82 };

// booth (cashier) | counter (belt) | lane, west to east
export const LANES = [
  { n: 1, open: false, booth: [-10.4, -9.6], counter: [-9.6, -8.8], lane: [-8.8, -7.6] },
  { n: 2, open: false, booth: [-7.6, -6.8], counter: [-6.8, -6.0], lane: [-6.0, -4.8] },
  { n: 3, open: true, booth: [-4.8, -4.0], counter: [-4.0, -3.2], lane: [-3.2, -2.0] },
];
export const LANE_END_CAP = [-2.0, -1.6];

export const PFAND = { x: 17.3, z: 12.0 }; // front face of the reverse vending machine

export const AISLES = {
  produceWall: { x: 18.0, z0: -9.5, z1: 8.5, depth: 0.9 },
  produceIsland: { cx: 13.9, z0: -6.0, z1: 4.0 },
  gondolas: [
    { cx: 10.3, east: ['brot', 'fruehstueck'], west: ['kaffee-tee', 'backen'] },
    { cx: 6.9, east: ['nudeln-reis', 'gewuerze'], west: ['saucen-oel', 'konserven'] },
    { cx: 3.5, east: ['suesses'], west: ['knabbern'] },
    { cx: 0.1, east: ['drogerie', 'baby'], west: ['haushalt', 'tier'] },
  ],
  gondolaZ: [-8.6, 0.4],
  freezer: { cx: -3.7, z0: -8.6, z1: 0.4, east: ['tk'], west: ['eis'] },
  drinks: { cx: -7.5, z0: -8.6, z1: 0.4, east: ['saefte'], west: ['bier-wein'] },
  pallets: { x: -11.7, z0: -8.6, depth: 0.8 },
  chiller: { x0: -11.5, x1: 9.6, z: -13.0, sections: ['feinkost', 'molkerei', 'kaese', 'wurst', 'fleisch'] },
  bakery: { x0: 10.2, x1: 17.0, z: -13.0 },
  bins: [
    { cx: -4.6, cz: 3.2, ids: ['bohrschrauber', 'eiskratzer'] },
    { cx: -1.0, cz: 3.2, ids: ['lichterkette', 'thermobecher'] },
    { cx: 2.6, cz: 3.2, ids: ['thermosocken', 'fleecedecke'] },
  ],
  season: { cx: 7.6, cz: 3.2 },
  flowers: { x0: 12.9, x1: 14.3, z: 9.4 },
};

// Outside
export const LOT = {
  x0: -24, x1: 26, z0: 17.5, z1: 38,
  rows: [
    { z0: 18.0, z1: 23.0, facing: -1 }, // nose towards the shop
    { z0: 30.0, z1: 35.0, facing: 1 },
  ],
  aisleZ: [23.0, 30.0],
  spaceW: 2.5,
  spacesX0: -22.5,
  count: 18,
};
export const ACCESS = { x0: 26.5, x1: 31.5, z0: 17.5, z1: 46 };
export const STREET = { z0: 46, z1: 53, x0: -120, x1: 120 };
// cart corral: carts nose north, the open end faces the car park
export const CORRAL = { x0: 19.7, x1: 21.5, z0: 13.6, z1: 17.0 };
export const START = { x: -6, z: 51.2, heading: -Math.PI / 2 }; // on the street, driving east

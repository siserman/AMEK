# AMEK

A grocery run as a life simulation, in the browser. You arrive by car, park,
get a cart for a euro, return your empties, shop from a list, put everything on
the belt, pay, pack it back into the cart, load the boot, return the cart and
drive home. The whole circle, at a German discounter called **AMEK**.

- Concept and roadmap: [`CONCEPT.md`](CONCEPT.md)
- Assortment: [`data/sortiment.json`](data/sortiment.json) (285 SKUs, 30 sections)
- Shopping lists: [`data/einkaufszettel.json`](data/einkaufszettel.json)

## Play

No build step. Any static web server will do (ES modules and `fetch()` don't
work from `file://`):

```sh
npm start              # node tools/serve.mjs → http://localhost:8080/
# or: python3 -m http.server 8080
```

It can also go straight onto GitHub Pages: the repo root is the site.

| Key | Action |
| --- | --- |
| Mouse | look around (click into the picture to capture the mouse) |
| W A S D | walk / drive, Shift to run |
| E or left click | take, use, get in and out of the car |
| Q or right click | put the item you're looking at back on its shelf |
| F | push / let go of the cart |
| Tab | what's in the cart |
| Space | brake (in the car) · V cockpit view · H horn · M sound |

On phones and tablets a stick, look-by-dragging and buttons replace the keys.

## v0.1 (2026-10-26): what's in

- **Arriving:** a street, an access road with the AMEK pylon, a 36-bay car park
  with parked cars, family, disabled and EV bays, lamps, trees and houses. You
  drive a Kombi (bicycle-model steering), park in a free bay and get out; the
  Parkscheibe gets set for you.
- **The cart:** a corral with nested carts and a 1-€ coin lock. The euro comes
  back when you return the cart, and the end screen notices when you don't.
  Items pile up inside the basket by a little packer; water packs and crates go
  on the bottom tray.
- **Leergut:** a bag of 8 PET bottles in the boot. The Pfandautomat by the
  entrance counts them one by one and prints a Pfandbon, which the cashier
  deducts at the till.
- **The market** (~780 m²): entrance through sliding doors and a one-way gate,
  fruit & veg in tilted crates (loose produce is weighed at the till),
  a self-service Backstation, a 21 m chilled wall, four double-sided aisles,
  freezer chests, drinks and pallets, the "Aktion" bins, a Christmas-biscuit
  display (it's late October), flowers, signage, and six other shoppers pushing
  carts around. About 12,000 individual packs sit on the shelves; every one you
  take leaves a gap, and Q puts it back.
- **Products:** every SKU has package art drawn at load time (fictional AMEK
  house brands), a shelf tag with price and Grundpreis (per kg/l, as PAngV
  requires since 2022), Pfand where it applies, and offer prices with "statt".
- **The till:** load the belt (hold E), the cashier scans at discounter speed
  into a small bay, and you'd better pack fast. The customer display shows each
  line and the total. Pay by girocard (PIN above 50 €) or count out cash from
  your wallet and get change back.
- **The Kassenbon:** item lines, quantities and weights, Pfand lines, the
  Leergutbon, MwSt A (7 %) / B (19 %) table, savings, card slip and the
  TSE lines every German receipt carries.
- **Leaving:** the exit only opens when everything is paid, then boot, corral,
  drive off, and a summary of the trip.

## Code

Plain ES modules on three.js (vendored in `vendor/`, r180, MIT).

```
src/
  main.js            boot, render loop
  data.js            loads the assortment, expands flavour variants, prices in cents
  engine/            input (keys, mouse, touch), synthesised audio, 2D collision
  world/             layout, store shell & tills, fixtures + planogram, car park,
                     product atlas (package art + price tags), product templates,
                     models (cart, car, people)
  game/              the trip: player, cart & packer, car, till, other shoppers
  ui/                HUD and overlays (payment terminal, receipt, end screen)
data/                sortiment.json, einkaufszettel.json
tests/smoke.mjs      plays the whole trip headless and checks the receipt
tools/serve.mjs      static server
```

Shelves are stocked by a planogram (`src/world/fixtures.js`): sections are
blocked vertically, tallest products go to the bottom, facings widen until the
shelf is full. All packs of one fixture side are one merged mesh; taking an item
collapses its vertices and picking is a ray against per-item boxes in a 1 m grid.

## Test

```sh
npm install        # playwright
npm test
```

`tests/smoke.mjs` serves the repo, starts a game in headless Chromium and plays
it through the game's own actions: park, take a cart, return the empties, walk
in (and check the gate won't let you out), shop the Bolognese list by aiming at
real packs, put one back, use the till, check that the receipt equals items +
Pfand − Leergutbon, pay by card, leave, load the boot, return the cart, drive
home. `--shots <dir>` saves screenshots along the way.

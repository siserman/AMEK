# AMEK

A grocery run as a life simulation, in the browser. You arrive by car, park,
get a cart for a euro, return your empties, shop from a list, put everything on
the belt, pay, pack it back into the cart, load the boot, return the cart and
drive home. The whole circle, at a German discounter called **AMEK**.

Or just watch: in **watch mode** the market runs on its own, for days and weeks,
as a time-lapse. Customers come by car or on foot and do the same circle; at
five in the morning the truck backs up to the dock, the team unloads it, fills
the shelves, sits at the tills and fetches the carts.

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

### Watch mode

"Markt beobachten" on the start screen (or `index.html?watch`).

| Control | Action |
| --- | --- |
| ❚❚ 1× 10× 60× 300× 1800× | time-lapse speed (Space pauses, 1–5 pick a speed) |
| Zum nächsten Morgen | skip to 06:30 on the next working day |
| Drag / Shift-drag or right-drag / wheel | turn / move / zoom; W A S D moves, Q E turns |
| Überblick, Draufsicht, Regale, Kassen, Laderampe, Parkplatz | camera presets; looking in from above lifts the roof off |
| Jemandem folgen | follow a customer or someone from the team, with what they're doing right now |
| Aufnehmen | record the view with a time stamp as a WebM video (when AMEK runs on its own page) |

The panel shows the day so far (customers served, revenue, average receipt,
queue, open tills, waiting time, how full the shelves are, the car park, staff on
duty), customers per hour, revenue per day, and a ticker of what just happened.

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

## v0.2 (2026-10-26): the market runs without you

- **Customers** arrive by car (find a free bay, park, get out, take a cart for a
  euro) or on foot from either end of the street, wait for the doors if they're
  early, walk the shop in a sensible order, look around, sometimes buy on
  impulse, queue at the till, put everything on the belt, pay, pack, load the
  boot, return the cart (most of them) and drive off. They take real packs off
  the shelves, so gaps appear where they shop.
- **Traffic** follows the clock: a weekday curve with the after-work peak, a
  heavier Friday and Saturday, closed on Sunday. About 950 customers and
  16,000 € on an ordinary weekday.
- **The truck** arrives at 05:05 every working day (no lorries on Sunday), backs
  up to the new loading dock behind the annex, and the early shift wheels nine
  roll cages into the backroom. The order is sized on expected demand for the day.
- **The team** works early (05:30–14:30) and late (13:30–22:30) shifts, with
  extra hands on Friday and Saturday. They change in the annex, then do whatever
  is most needed: open a till ("Kasse 2 bitte!"), hand over at shift change,
  help at the dock, refill shelves from the backroom (one pack at a time, the
  emptiest shelves first, everything topped up before opening), tidy, and bring
  in the carts. A second and third till open when queues stay long and close
  again when it's quiet, but in the rush hours a second till stays open.
- **Day and night:** the sun rises at 07:21 and sets at 16:54 (late October),
  the shop lights come on shortly after five, car headlights and the lot lamps
  glow in the dark, and the lights go out at 22:45.
- **The world grew a back side:** a staff door, the backroom annex with racks
  and a roll-up dock door, and a service lane for the truck.

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
  sim/               watch mode: clock, walkway network, agents (customers, staff,
                     cars, the truck), stock and deliveries, tills, day and night,
                     the orbit camera
  ui/                HUD and overlays (payment terminal, receipt, end screen),
                     watch-mode HUD with charts
data/                sortiment.json, einkaufszettel.json
tests/smoke.mjs      plays the whole trip headless and checks the receipt
tests/sim.mjs        runs the market for a week and checks every day closes the circle
tools/serve.mjs      static server
```

Shelves are stocked by a planogram (`src/world/fixtures.js`): sections are
blocked vertically, tallest products go to the bottom, facings widen until the
shelf is full. All packs of one fixture side are one merged mesh; taking an item
collapses its vertices and picking is a ray against per-item boxes in a 1 m grid.

The simulation (`src/sim/`) is independent of frame rate: every agent works off
a queue of steps (walk a path, wait, wait until, do something) with whatever
simulated time the frame gives it, in fixed sub-steps, so 1× and 1800× follow
the same rules. People move on a network of walkways (aisles, the front
walkway, the car park, the back of house) with precomputed shortest paths; cars
and the truck follow curves and drive on the right. Each shelf slot has a
capacity and a fill level; the backroom holds the rest. A simulated day takes a
few hundred milliseconds of computing, a week a few seconds.

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

`tests/sim.mjs` opens watch mode and runs a whole week: the truck at five, the
delivery unloaded, the early shift in, customers served, a second till opening at
the peak, everyone gone by 23:30, the shelves full again in the morning, "next
morning" landing on 06:30, a delivery and hundreds of customers every working
day, Saturday busier than Monday, Sunday closed, and empty shelves staying rare.

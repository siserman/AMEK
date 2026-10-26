# AMEK – Concept

## The idea

A virtual supermarket shows up in a lot of ideas in this portfolio: the
supermarket in the pig simulator, Shoppinger, Snackinger, Cookinger, Pakker as a
shopping cart. AMEK is the supermarket itself, built once and properly, as a
life simulation: not a shop menu but the whole trip.

> Arrive with the car, get a cart, go in, put things in the cart, pay, put
> things back in the cart, leave. The full circle.

AMEK is a fictional German discounter. Its assortment, prices, store layout and
rituals are modelled on how a Lidl-type discounter in Germany works, but every
brand on the shelf is an AMEK house brand. Real chains and real products come
later (see the roadmap) and need their own data and their own care.

## What makes it feel real

The goal is recognition: "yes, that's exactly how it is". So v0.1 spends its
effort on the small rituals rather than on graphics:

| Ritual | In the game |
| --- | --- |
| The 1-€ coin for the cart | coin lock; the euro returns at the corral; the end screen remembers if you left the cart in a parking bay |
| Leergut first | bag of empties in the boot, Pfandautomat counts bottles, Pfandbon goes to the till |
| Turnstile at the entrance | swings inward only; "Kein Ausgang" |
| Fruit & veg first, bakery next | entrance → produce → Backstation → chilled wall → aisles → freezer → drinks → tills |
| Loose produce is weighed at the till | weight is drawn when you take it; the receipt prints "1,161 kg x 1,49 EUR/kg" |
| Grundpreis on every tag | always per kg/l (PAngV 2022), Pfand noted separately |
| The cashier is fast | scans into a small bay; when it is full, she waits and says so |
| Paying | girocard contactless, PIN above 50 €; or cash from your actual coins and notes, with change |
| The receipt | VAT split A 7 % / B 19 %, Pfand lines, Leergutbon, savings, TSE lines |
| Leaving | the exit won't open with unpaid goods; boot; corral; Parkscheibe; drive off |
| It's late October | Lebkuchen and Spekulatius are already in, Halloween gummies, Hokkaido, Glühwein |

## The assortment as shared data

`data/sortiment.json` is deliberately plain data so the other apps can read the
same supermarket:

- **Shoppinger / Pakker**: a real product catalogue with sizes, prices, Pfand and
  VAT to build lists and carts against.
- **Cookinger**: recipes turn into shopping lists (`data/einkaufszettel.json`
  already does this for Spaghetti Bolognese) and lists into routes through the
  market.
- **Snackinger**: the same items, with the snack/meal judgement it already has.
- **Pig simulator**: the supermarket scene, as a place.

Each product: id, name, brand, section, size, quantity + unit for the Grundpreis,
price, VAT rate, Pfand, shape and dimensions in metres, label colours, tags (bio,
vegan, regional, saison, alkohol), loose-weight range, flavour variants.

## Roadmap

**v0.2 – the market runs without you** (done)
- Watch mode with time-lapse: customers doing the whole circle by car or on
  foot, the morning delivery, staff shifts, restocking from the backroom,
  queues and "Kasse 2 bitte!", day and night, weeks at a time
- Follow one person; numbers of the day; record a time-lapse video

**v0.2.x – both at once**
- Shop yourself in a market full of simulated customers (they queue in front of
  you; the shelf you want may just have been emptied)
- The Warentrenner, a basket as the alternative to the cart, the packing table
- Tongs and paper bags at the Backstation
- More SKUs per section (the shelves repeat products more than a real store)
- Quality setting for weaker GPUs and phones (fewer packs deep, no shadows)

**v0.3 – VR**
- WebXR: grab packs with your hands, push the cart by its handle, tap the card
  on the terminal. three.js already speaks WebXR; the interaction layer needs
  hands instead of a crosshair.

**v0.4 – real supermarkets**
- Real products from open data (e.g. Open Food Facts, ODbL: names, brands,
  sizes, barcodes, nutrition) instead of invented ones
- Real store layouts, as floor plans or reconstructed from photos
- Brand names, logos and store designs belong to their owners: simulating a
  real chain needs permission or at least careful thought; AMEK stays the
  sandbox until then

**Later**
- Weather, holidays and paydays in the traffic curve; Mindesthaltbarkeit and
  markdowns in the evening; a weekly flyer that moves demand
- Budget and nutrition goals from Snackinger and Cookinger
- Your own fridge at home, where the trip ends

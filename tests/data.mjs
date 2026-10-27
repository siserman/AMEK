// The product data, checked without a browser: every product has packaging and
// a valid, unique GTIN; foods have nutrition values that add up; the barcode and
// QR helpers produce what scanners expect.
//   node tests/data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepare } from '../src/data.js';
import { checkDigit, isValidGtin, ean13Modules, ean13Svg, digitalLink } from '../src/barcode.js';
import qrcode from '../vendor/qrcode.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8'));
const pd = read('produktdaten.json');
const data = prepare(read('sortiment.json'), read('einkaufszettel.json'), pd);
const products = data.products;

let failed = 0;
const check = (ok, msg, bad = []) => {
  console.log((ok ? '  ok   ' : '  FAIL ') + msg + (bad.length ? ': ' + bad.slice(0, 6).join(', ') + (bad.length > 6 ? ` … (${bad.length})` : '') : ''));
  if (!ok) failed++;
};
const where = (fn) => products.filter(fn).map((p) => p.id);

// barcodes
check(checkDigit('400638133393') === '1' && isValidGtin('4006381333931') && !isValidGtin('4006381333932'), 'GS1 check digit matches a known EAN-13');
check(ean13Modules('4006381333931') === '10100011010100111010111101111010001001011001101010100001010000101000010111010010000101100110101', 'EAN-13 module pattern (start, L/G parity, centre, R, end)');
check(/^<svg[^>]+viewBox="0 0 226 /.test(ean13Svg('4006381333931')), 'EAN-13 SVG with quiet zones (113 modules wide)');
check(digitalLink('2026350010016') === 'https://amek.example/01/02026350010016', 'GS1 Digital Link uses the 14-digit GTIN');
const qr = qrcode(0, 'M');
qr.addData(digitalLink(products[0].gtin));
qr.make();
check(qr.getModuleCount() >= 21, `QR code for a Digital Link (${qr.getModuleCount()} modules)`);

// GTINs
check(where((p) => !p.gtin).length === 0, 'every product has a GTIN', where((p) => !p.gtin));
check(where((p) => p.gtin && !isValidGtin(p.gtin)).length === 0, 'every GTIN has a valid check digit', where((p) => p.gtin && !isValidGtin(p.gtin)));
check(where((p) => p.gtin && !p.gtin.startsWith('202635')).length === 0, 'all GTINs are in-store numbers (GS1 prefix 20, 2635 = AMEK)');
check(new Set(products.map((p) => p.gtin)).size === products.length, 'GTINs are unique');
check(Object.keys(pd.gtin).every((id) => data.byId.has(id)), 'no GTIN for a product that does not exist', Object.keys(pd.gtin).filter((id) => !data.byId.has(id)));
check(where((p) => (p.loose || p.section === 'backstation') && !p.plu).length === 0, 'loose produce and bakery items have a cashier code');

// packaging
check(where((p) => !p.pack || !p.pack.type).length === 0, 'every product has a packaging type', where((p) => !p.pack || !p.pack.type));
check(where((p) => p.pack && p.pack.type !== 'lose Ware' && p.pack.type.indexOf('Stückware') !== 0 && !p.pack.material).length === 0, 'packed products name a material', where((p) => p.pack && p.pack.type !== 'lose Ware' && p.pack.type.indexOf('Stückware') !== 0 && !p.pack.material));
check(where((p) => !(p.dim.length === 3 && p.dim.every((d) => d > 0 && d < 1))).length === 0, 'every product has outer dimensions under a metre');
check(Object.keys(pd.products).every((id) => data.byId.has(id) || products.some((p) => p.base === id)), 'product data only for known products', Object.keys(pd.products).filter((id) => !data.byId.has(id) && !products.some((p) => p.base === id)));

// nutrition
const kinds = Object.keys(pd.meta.declaration);
check(where((p) => !kinds.includes(p.declaration)).length === 0, 'every product says how its nutrition is declared', where((p) => !kinds.includes(p.declaration)));
const food = (p) => !['nonfood', 'feed', 'annex-v'].includes(p.declaration);
const FIELDS = ['kcal', 'fat', 'sat', 'carb', 'sugar', 'fibre', 'protein', 'salt'];
check(where((p) => food(p) && !(p.nutrition && FIELDS.every((f) => typeof p.nutrition[f] === 'number' && p.nutrition[f] >= 0))).length === 0, 'foods have all eight values per 100 g/ml', where((p) => food(p) && !p.nutrition));
check(where((p) => p.nutrition && (p.nutrition.sat > p.nutrition.fat || p.nutrition.sugar > p.nutrition.carb)).length === 0, 'saturates ≤ fat and sugars ≤ carbohydrate', where((p) => p.nutrition && (p.nutrition.sat > p.nutrition.fat || p.nutrition.sugar > p.nutrition.carb)));
// energy from the macros (EU factors: fat 9, carbohydrate 4, protein 4, fibre 2, alcohol 7 kcal/g)
const energy = (p) => {
  const n = p.nutrition, alcohol = (p.abv || 0) * 0.789;
  return 9 * n.fat + 4 * n.carb + 4 * n.protein + 2 * n.fibre + 7 * alcohol;
};
const off = where((p) => p.nutrition && Math.abs(energy(p) - p.nutrition.kcal) > Math.max(8, p.nutrition.kcal * 0.08));
check(off.length === 0, 'energy matches fat, carbohydrate, protein, fibre and alcohol within 8 %', off.map((id) => `${id} (${data.byId.get(id).nutrition.kcal} vs ${Math.round(energy(data.byId.get(id)))})`));
check(where((p) => p.nutrition && p.nutrition.fat + p.nutrition.carb + p.nutrition.protein + p.nutrition.fibre + p.nutrition.salt > 101).length === 0, 'no more than 100 g of nutrients in 100 g');
check(where((p) => p.tags.includes('alkohol') && !(p.abv > 1.2)).length === 0, 'alcoholic drinks state their strength');
check(where((p) => p.declaration === 'e-label').every((id) => data.byId.get(id).abv > 1.2), 'the wine e-label only on wine');
check(where((p) => p.declaration === 'feed' && !(p.feed && p.feed.protein >= 0 && p.feed.moisture > 0)).length === 0, 'pet food lists its analytical constituents');

// the generated list is current (npm run sortiment rewrites it)
const md = fs.readFileSync(path.join(root, 'docs/sortiment.md'), 'utf8');
const stale = where((p) => !md.includes('`' + p.gtin + '`'));
check(stale.length === 0 && md.includes(`${products.length} Artikel`), 'docs/sortiment.md lists every product (else: npm run sortiment)', stale);

console.log(`${products.length} products, ${where((p) => p.nutrition).length} with nutrition values`);
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);

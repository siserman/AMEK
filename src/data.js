// Loads the AMEK assortment (data/sortiment.json), its product data (packaging,
// nutrition, GTINs: data/produktdaten.json) and the shopping lists, expands
// flavour variants into their own SKUs and converts prices to cents.
import { cents, grundpreis } from './util.js';

export async function loadData(base = '') {
  const [sortiment, zettel, produktdaten] = await Promise.all([
    fetch(base + 'data/sortiment.json').then((r) => r.json()),
    fetch(base + 'data/einkaufszettel.json').then((r) => r.json()),
    fetch(base + 'data/produktdaten.json').then((r) => r.json()),
  ]);
  return prepare(sortiment, zettel, produktdaten);
}

export function prepare(sortiment, zettel, produktdaten = { products: {}, gtin: {}, plu: {} }) {
  const sections = new Map(sortiment.sections.map((s) => [s.id, s]));
  const products = [];
  for (const raw of sortiment.products) {
    const variants = raw.variants || [null];
    for (const v of variants) {
      const p = { ...raw, ...(v || {}) };
      delete p.variants;
      delete p.v;
      if (v) {
        p.id = raw.id + '-' + v.id;
        p.name = raw.name.replace('{v}', v.v);
      }
      p.name = p.name.replace(' {v}', '').replace('{v}', '');
      p.priceEuro = p.price;
      p.price = cents(p.price);
      p.was = p.was ? cents(p.was) : null;
      p.pfand = p.pfand ? cents(p.pfand) : 0;
      p.bon = p.bon || shorten(p.name);
      p.tags = p.tags || [];
      p.cap = p.cap || p.accent;
      p.fruit = p.fruit || p.accent;
      p.grundpreis = grundpreis({ ...p, price: p.price });
      // product data: the base entry, overridden where a variant differs
      const pd = produktdaten.products, extra = { ...pd[raw.id], ...(v ? pd[p.id] : null) };
      p.base = raw.id;
      p.pack = extra.pack || null;
      p.declaration = extra.declaration || null;
      p.nutrition = extra.nutrition || null;
      p.abv = extra.abv ?? null;
      p.feed = extra.feed || null;
      p.note = extra.note || null;
      p.gtin = produktdaten.gtin[p.id] || null;
      p.plu = produktdaten.plu[p.id] || null;
      p.index = products.length;
      products.push(p);
    }
  }
  const byId = new Map(products.map((p) => [p.id, p]));
  const lists = zettel.lists.map((l) => ({
    ...l,
    items: l.items.map((it) => ({ ...it, count: it.count || 1, ids: expandIds(it.any, products) })),
  }));
  return { meta: sortiment.meta, productMeta: produktdaten.meta || null, brands: sortiment.brands, sections, products, byId, lists };
}

function expandIds(patterns, products) {
  const out = new Set();
  for (const pat of patterns) {
    if (pat.endsWith('*')) {
      const pre = pat.slice(0, -1);
      for (const p of products) if (p.id.startsWith(pre)) out.add(p.id);
    } else out.add(pat);
  }
  return out;
}

function shorten(name) {
  return name.length <= 26 ? name : name.slice(0, 25).trimEnd() + '.';
}

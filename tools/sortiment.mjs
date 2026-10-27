// Writes the assortment list from the data: docs/sortiment.md (tables, readable
// on GitHub) and docs/sortiment.html (one self-contained page with search,
// filters and a data sheet per product: packaging, dimensions, nutrition,
// EAN-13 and QR code).
//   node tools/sortiment.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepare } from '../src/data.js';
import { digitalLink } from '../src/barcode.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const json = (f) => JSON.parse(read(f));
const pd = json('data/produktdaten.json');
const data = prepare(json('data/sortiment.json'), json('data/einkaufszettel.json'), pd);

const euro = (c) => (c / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v, d = 1) => v.toLocaleString('de-DE', { maximumFractionDigits: d });
const mm = (p) => p.dim.map((d) => Math.round(d * 1000));
const sections = [...data.sections.values()].map((s) => ({ ...s, items: data.products.filter((p) => p.section === s.id) }));

// --- the page ---------------------------------------------------------------------------
const page = {
  declaration: pd.meta.declaration,
  sections: sections.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    items: s.items.map((p) => ({
      id: p.id, n: p.name, b: p.brand || '', s: p.size || '', p: p.price, w: p.was || 0, f: p.pfand || 0,
      g: p.grundpreis || (p.loose ? 'Preis je kg' : ''), v: p.vat, t: p.tags, o: p.origin || '',
      c: p.color || '#cccccc', a: p.accent || p.color || '#999999',
      gtin: p.gtin, plu: p.plu, pack: p.pack, dim: mm(p), decl: p.declaration, nu: p.nutrition,
      abv: p.abv, feed: p.feed, note: p.note, ml: p.unit === 'ml' || p.unit === 'l',
    })),
  })),
};
// the barcode helpers and the QR encoder go inline, so the page works on its own
const plain = (code) => code.replace(/^export default .*$/gm, '').replace(/^export /gm, '');
const lib = [read('vendor/qrcode.js'), read('src/barcode.js')].map(plain).join('\n');
const html = read('tools/sortiment.page.html')
  .replace('/*DATA*/', () => JSON.stringify(page).replace(/</g, '\\u003c'))
  .replace('/*LIB*/', () => lib);
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/sortiment.html'), html);

// --- the Markdown list ----------------------------------------------------------------------
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|');
const g = (v, d = 1) => (v > 0 && v < 0.1 ? '< 0,1' : num(v, d));
const out = [];
out.push('# AMEK Sortiment', '');
out.push(`${data.products.length} Artikel in ${sections.length} Abteilungen, in der Reihenfolge des Rundgangs durch den Markt. Erzeugt mit \`node tools/sortiment.mjs\` aus \`data/sortiment.json\` und \`data/produktdaten.json\`; nicht von Hand bearbeiten.`, '');
out.push('Zum Durchsuchen, mit Datenblatt, Barcode und QR-Code je Artikel: [sortiment.html](sortiment.html) (im Spiel-Server unter `/docs/sortiment.html`).', '');
out.push('- **Preise:** ungefähre Regalpreise eines deutschen Discounters, Stand 2025/26. Grundpreis je kg oder l nach Preisangabenverordnung. MwSt A = 7 %, B = 19 %.');
out.push('- **Verpackung:** Art und Hauptmaterial; Maße der Verkaufseinheit als Breite × Höhe × Tiefe in mm (dieselben Maße wie die 3D-Packungen im Spiel).');
out.push(`- **Nährwerte:** ${pd.meta.nutrition}`);
out.push(`- **EAN:** ${pd.meta.gtin} QR-Code: GS1 Digital Link, z. B. ${digitalLink(data.products[0].gtin)}.`);
out.push('- **Marken:** alle erfunden.', '');
out.push('Kennzeichnung der Nährwerte:', '');
for (const [k, v] of Object.entries(pd.meta.declaration)) out.push(`- \`${k}\`: ${v}`);
out.push('');
for (const s of sections) {
  out.push(`## ${s.name}`, '');
  out.push('| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |');
  out.push('|---|---|---|---|---|--:|---|---|');
  for (const p of s.items) {
    const name = p.name + (p.was ? ` (statt ${euro(p.was)})` : '') + (p.pfand ? ` + ${euro(p.pfand)} Pfand` : '') + (p.abv != null ? `, ${num(p.abv)} % vol` : '');
    const pack = p.pack.type + (p.pack.material ? `, ${p.pack.material}` : '') + (p.pack.units ? `, ${p.pack.units} Einheiten` : '');
    out.push(`| ${cell(name)} | ${cell(p.brand || 'aus dem Ofen')} | ${cell(p.size)} | ${cell(pack)} | ${mm(p).join(' × ')} | ${euro(p.price)} | ${cell(p.grundpreis || (p.loose ? 'je kg' : ''))} | \`${p.gtin}\`${p.plu ? ` · Kasse ${p.plu}` : ''} |`);
  }
  const withN = s.items.filter((p) => p.nutrition);
  if (withN.length) {
    out.push('', `Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):`, '');
    out.push('| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |');
    out.push('|---|--:|--:|--:|--:|--:|--:|--:|--:|');
    for (const p of withN) {
      const n = p.nutrition, it = p.declaration !== 'table' && p.declaration !== 'e-label' ? '*' : '';
      out.push(`| ${it}${cell(p.name)}${it} | ${Math.round(n.kcal * 4.184)} / ${num(n.kcal, 0)} | ${g(n.fat)} | ${g(n.sat)} | ${g(n.carb)} | ${g(n.sugar)} | ${g(n.fibre)} | ${g(n.protein)} | ${g(n.salt, 2)} |`);
    }
  }
  const feed = s.items.filter((p) => p.feed);
  if (feed.length) {
    out.push('', 'Analytische Bestandteile (Futtermittel):', '');
    out.push('| Artikel | Rohprotein | Fettgehalt | Rohasche | Rohfaser | Feuchtigkeit |');
    out.push('|---|--:|--:|--:|--:|--:|');
    for (const p of feed) out.push(`| ${cell(p.name)} | ${num(p.feed.protein)} % | ${num(p.feed.fat)} % | ${num(p.feed.ash)} % | ${num(p.feed.fibre)} % | ${num(p.feed.moisture)} % |`);
  }
  out.push('');
}
fs.writeFileSync(path.join(root, 'docs/sortiment.md'), out.join('\n'));
console.log(`docs/sortiment.md, docs/sortiment.html: ${data.products.length} Artikel, ${(html.length / 1024).toFixed(0)} KB Seite`);

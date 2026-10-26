// Heads-up display: objective, clock & wallet, shopping list, prompts, the
// shelf-tag card for whatever you look at, and short messages.
import { euro, kg, fmtClock, el } from '../util.js';
import { GATE } from '../world/layout.js';

const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.root = $('hud');
    this.cache = {};
    this.toasts = $('toasts');
  }

  show(on = true) {
    this.root.hidden = !on;
  }

  set(id, value, prop = 'textContent') {
    const key = id + prop;
    if (this.cache[key] === value) return;
    this.cache[key] = value;
    $(id)[prop] = value;
  }

  toast(text, kind = 'info', ms = 3200) {
    const t = el('div', 'toast ' + kind, text);
    this.toasts.prepend(t);
    while (this.toasts.children.length > 4) this.toasts.lastChild.remove();
    setTimeout(() => t.classList.add('out'), ms);
    setTimeout(() => t.remove(), ms + 600);
  }

  setPfand(n, total, value) {
    const box = $('pfand-display');
    if (n === null) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.innerHTML = `<span>Flaschen</span><b>${n} / ${total}</b><span>Pfand</span><b>${euro(value)} €</b>`;
  }

  update(g) {
    const s = g.state;
    this.set('clock', 'Sa ' + fmtClock(g.clockDate()));
    this.set('wallet', euro(g.cash()) + ' € bar');
    this.set('objective-text', objective(g));
    this.updateList(g);
    this.updatePrompt(g);
    this.updateCard(g);
    this.updateCartChip(g);
    this.updateRegister(g);
    $('crosshair').hidden = g.mode !== 'walk';
    $('drive-help').hidden = g.mode !== 'drive';
    if (g.mode === 'drive') this.set('speed', Math.round(Math.abs(g.car.speed) * 3.6) + ' km/h');
  }

  updateList(g) {
    const box = $('zettel');
    const l = g.state.list;
    if (!l.items.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    this.set('zettel-title', l.title);
    const prog = g.listProgress();
    const sig = prog.map((p) => p.have).join(',');
    if (this.cache.listSig === sig) return;
    this.cache.listSig = sig;
    const ol = $('zettel-items');
    ol.replaceChildren(
      ...prog.map((p) => {
        const li = el('li', p.have >= p.need ? 'done' : '');
        li.append(el('span', 'qty', p.need > 1 ? p.need + '×' : ''), el('span', 'what', p.label));
        if (p.need > 1 && p.have && p.have < p.need) li.append(el('span', 'part', `${p.have}/${p.need}`));
        return li;
      })
    );
  }

  updatePrompt(g) {
    const box = $('prompt');
    let main = null, alt = null;
    if (g.mode === 'drive') {
      main = Math.abs(g.car.speed) < 0.6 && g.car.z < 45.5 ? 'Aussteigen' : null;
      const sp = g.parkedSpace();
      if (sp && main) main = 'Aussteigen – gut geparkt!';
    } else if (g.mode === 'walk' && g.focus) {
      const f = g.focus;
      if (f.kind === 'product') {
        const rec = f.hit.inst || g.ps.frontOfSlot(f.hit.slot);
        if (rec) {
          const cart = g.nearCart(3.2);
          main = cart ? 'In den Wagen' : g.state.hands.length < 4 ? `Nehmen (Hände ${g.state.hands.length}/4)` : 'Hände voll';
          if (f.hit.slot.kind === 'bulk' && f.hit.slot.stock <= 0) main = 'Leer';
        }
        if (g.canPutBack()) alt = 'Zurücklegen';
      } else main = f.it.label();
    }
    box.hidden = !main && !alt;
    $('prompt-main').hidden = !main;
    $('prompt-alt').hidden = !alt;
    if (main) this.set('prompt-text', main);
    if (alt) this.set('prompt-alt-text', alt);
    const cartKey = $('prompt-cart');
    const showF = g.mode === 'walk' && g.cart && (g.player.cart || g.nearCart(1.6));
    cartKey.hidden = !showF;
    if (showF) this.set('prompt-cart-text', g.player.cart ? 'Wagen loslassen' : 'Wagen schieben');
  }

  updateCard(g) {
    const card = $('product-card');
    const f = g.focus;
    const p = f && f.kind === 'product' ? f.hit.slot.p : null;
    card.hidden = !p;
    if (!p || this.cache.cardSku === p.id) return;
    this.cache.cardSku = p.id;
    card.classList.toggle('offer', !!p.was);
    $('pc-brand').textContent = p.brand || 'AMEK Backstation';
    $('pc-name').textContent = p.name;
    $('pc-size').textContent = p.loose ? 'lose, wird gewogen' + (p.origin ? ' · ' + p.origin : '') : p.size + (p.origin ? ' · ' + p.origin : '');
    $('pc-price').textContent = euro(p.price);
    $('pc-unit').textContent = p.loose ? '€ / kg' : '€';
    $('pc-was').textContent = p.was ? 'statt ' + euro(p.was) : '';
    $('pc-base').textContent = [p.grundpreis, p.pfand ? `zzgl. ${euro(p.pfand)} € Pfand` : null].filter(Boolean).join(' · ');
    const tags = $('pc-tags');
    tags.replaceChildren(...p.tags.filter((t) => ['bio', 'vegan', 'regional', 'saison'].includes(t)).map((t) => el('span', 'tag ' + t, { bio: 'Bio', vegan: 'Vegan', regional: 'Regional', saison: 'Saison' }[t])));
  }

  updateCartChip(g) {
    const items = g.cart ? g.cart.items.filter((i) => !i.p.special) : [];
    const hands = g.state.hands;
    const sum = [...items, ...hands].filter((i) => !i.p.special).reduce((s, i) => s + i.price + (i.p.pfand || 0), 0);
    const chip = $('cart-chip');
    chip.hidden = g.mode !== 'walk';
    let t = g.cart ? `${items.length} Artikel im Wagen · ≈ ${euro(sum)} €` : 'Kein Einkaufswagen';
    if (hands.length) t += ` · ${hands.length} in der Hand`;
    this.set('cart-text', t);
  }

  updateRegister(g) {
    const box = $('register');
    const c = g.checkout;
    const near = g.mode === 'walk' && g.player.x > c.lane.lane[0] - 1.5 && g.player.x < c.lane.lane[1] + 1.5 && g.player.z > 5.5 && g.player.z < 12;
    const show = near && (c.lines.length > 0 || c.state !== 'idle');
    box.hidden = !show;
    if (!show) return;
    const l = c.lastLine;
    let line1 = 'KASSE ' + c.lane.n;
    if (l) {
      const name = l.name.slice(0, 20);
      line1 = l.kind === 'loose' ? `${name} ${kg(l.weight)}` : name;
    }
    const sig = line1 + c.total + c.state;
    if (this.cache.reg === sig) return;
    this.cache.reg = sig;
    $('reg-line').textContent = line1;
    $('reg-amount').textContent = l ? euro(l.total) : '';
    $('reg-total').textContent = (c.state === 'paid' ? 'BEZAHLT ' : 'SUMME ') + euro(c.total);
  }
}

function objective(g) {
  const s = g.state, f = s.flags;
  const pl = g.player;
  if (g.mode === 'drive') {
    if (!f.outOfCar) {
      const sp = g.parkedSpace();
      if (sp) return 'Gut geparkt. Mit E steigst du aus.';
      if (g.car.z > 45.5) return g.car.x < 24 ? 'Fahr weiter geradeaus, dann links rein zu AMEK.' : 'Hier links rein auf den AMEK-Parkplatz.';
      return 'Such dir eine freie Parklücke und halt darin an.';
    }
    if (f.paid) return 'Fahr vom Parkplatz auf die Straße – ab nach Hause.';
    return 'Steig wieder aus (E), wenn du parkst.';
  }
  if (g.pfandFeed) return 'Der Automat zählt deine Flaschen …';
  if (f.paid) {
    if (g.checkout.bay.length) return 'Pack die Ware aus der Ablage in den Wagen.';
    if (g.indoors) return 'Alles bezahlt. Raus durch den Ausgang.';
    if (g.cart && g.cart.items.some((i) => i.paid)) return 'Zum Auto: Einkäufe in den Kofferraum laden.';
    if (g.cart) return 'Wagen zurück in den Unterstand – dein Euro wartet.';
    return 'Einsteigen und nach Hause fahren.';
  }
  if (!g.cart && !f.entered) {
    return g.car.items.includes(g.leergut) ? 'Hol einen Einkaufswagen (1 €). Im Kofferraum liegt noch Leergut.' : 'Hol dir am Unterstand einen Einkaufswagen (1 €).';
  }
  if (!f.entered) {
    if (g.personItems().includes(g.leergut)) return 'Rein in den Markt. Der Pfandautomat steht gleich rechts.';
    return 'Rein in den Markt. Eingang rechts.';
  }
  const c = g.checkout;
  if (c.state === 'total') return `An der Kasse bezahlen: ${euro(c.total)} €`;
  if (c.belt.length || c.busy > 0) return 'Die Kassiererin scannt. Pack zügig ein!';
  if (c.atBelt(pl.x, pl.z) && g.hasUnpaidOnPerson()) return 'Leg alles aufs Band (E halten).';
  const prog = g.listProgress();
  const open = prog.filter((p) => p.have < p.need);
  if (s.list.items.length && open.length) return `Einkaufen: noch ${open.length} von ${prog.length} Posten auf dem Zettel.`;
  if (pl.z > GATE.z - 1 && pl.x > 12.5) return 'Ab in den Markt.';
  return g.personItems().some((i) => !i.p.special) ? 'Alles da? Dann ab zur Kasse 3.' : 'Schau dich um und nimm, was du brauchst.';
}

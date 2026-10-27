// Full-screen panels: start, pause, cart contents, card terminal & cash,
// the Kassenbon, and the end of the trip.
import { euro, kg, el } from '../util.js';
import { ean13Svg, checkDigit } from '../barcode.js';
import qrcode from '../../vendor/qrcode.js';

const $ = (id) => document.getElementById(id);
const DENOMS = [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export class Overlays {
  constructor(data, input) {
    this.data = data;
    this.input = input;
    // the start screen is open from the first paint
    this.openId = $('start').hidden ? null : 'start';
    input.uiOpen = !!this.openId;
    for (const b of document.querySelectorAll('[data-close]')) b.addEventListener('click', () => this.close());
    addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.openId && !['start', 'end', 'pay'].includes(this.openId)) this.close();
      if (e.code === 'Tab' && this.openId === 'cartlist') {
        e.preventDefault();
        this.close();
      }
    });
  }

  isOpen() {
    return !!this.openId;
  }

  open(id) {
    for (const s of document.querySelectorAll('.overlay')) s.hidden = s.id !== id;
    this.openId = id;
    this.input.uiOpen = true;
    this.input.releaseLock();
    const first = $(id).querySelector('[autofocus], button');
    if (first) first.focus({ preventScroll: true });
  }

  close() {
    if (!this.openId) return;
    $(this.openId).hidden = true;
    const was = this.openId;
    this.openId = null;
    this.input.uiOpen = false;
    if (this.onClose) this.onClose(was);
  }

  // --- start ---------------------------------------------------------------------
  initStart(onGo) {
    const box = $('scenarios');
    let chosen = this.data.lists[0];
    box.replaceChildren(
      ...this.data.lists.map((l, i) => {
        const b = el('button', 'scenario' + (i === 0 ? ' chosen' : ''));
        b.type = 'button';
        b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        b.append(el('strong', '', l.title), el('span', 'note', l.note));
        if (l.items.length) {
          const ul = el('ul');
          for (const it of l.items.slice(0, 5)) ul.append(el('li', '', (it.count > 1 ? it.count + '× ' : '') + it.label));
          if (l.items.length > 5) ul.append(el('li', 'more', `… und ${l.items.length - 5} mehr`));
          b.append(ul);
        }
        b.addEventListener('click', () => {
          chosen = l;
          for (const o of box.children) {
            o.classList.toggle('chosen', o === b);
            o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
          }
        });
        return b;
      })
    );
    $('go').addEventListener('click', () => onGo(chosen));
  }

  ready() {
    $('go').disabled = false;
    $('go').textContent = 'Losfahren';
    $('loading-note').hidden = true;
  }

  // --- cart list -------------------------------------------------------------------
  openCartList(g) {
    const items = g.personItems().filter((i) => !i.p.special);
    const body = $('cartlist-body');
    const groups = new Map();
    for (const it of items) {
      const k = it.p.id;
      const e = groups.get(k) || { p: it.p, n: 0, sum: 0, w: 0, paid: true };
      e.n++;
      e.sum += it.price + (it.p.pfand || 0);
      e.w += it.weight || 0;
      e.paid = e.paid && it.paid;
      groups.set(k, e);
    }
    let total = 0;
    const rows = [...groups.values()].map((e) => {
      total += e.sum;
      const tr = el('tr', e.paid ? 'paid' : '');
      tr.append(el('td', 'n', e.n + '×'), el('td', 'name', e.p.name + (e.p.loose ? ` (${kg(e.w)})` : '')), el('td', 'sum', euro(e.sum)));
      return tr;
    });
    body.replaceChildren(...rows);
    $('cartlist-total').textContent = euro(total) + ' €';
    $('cartlist-empty').hidden = rows.length > 0;
    const zettel = $('cartlist-zettel');
    const prog = g.state.list.items.length ? g.listProgress() : [];
    zettel.hidden = !prog.length;
    $('cartlist-zettel-items').replaceChildren(...prog.map((p) => el('li', p.have >= p.need ? 'done' : '', (p.need > 1 ? p.need + '× ' : '') + p.label + (p.need > 1 ? ` (${p.have}/${p.need})` : ''))));
    const lg = g.personItems().includes(g.leergut);
    $('cartlist-extra').textContent = [lg ? 'Dazu: ein Beutel Leergut (8 Flaschen).' : '', g.state.pfandBon ? `Pfandbon über ${euro(g.state.pfandBon)} € in der Tasche.` : ''].filter(Boolean).join(' ');
    this.open('cartlist');
  }

  // --- payment ---------------------------------------------------------------------
  openPay(total, g) {
    this.g = g;
    $('pay-amount').textContent = euro(total) + ' €';
    $('pay-error').textContent = '';
    $('pay-done').hidden = true;
    this.given = {};
    this.pin = '';
    this.showPayTab(total < 0 ? 'cash' : 'card');
    this.renderCash();
    $('pin-box').hidden = true;
    $('card-hint').textContent = total > 5000 ? 'Über 50 € fragt das Terminal nach deiner PIN.' : 'Bis 50 € geht es kontaktlos ohne PIN.';
    $('pin-note').textContent = `Deine PIN steht auf dem Zettel im Portemonnaie: ${g.state.card.pin}`;
    this.open('pay');
  }

  bindPay() {
    for (const b of document.querySelectorAll('[data-paytab]')) b.addEventListener('click', () => this.showPayTab(b.dataset.paytab));
    $('tap-card').addEventListener('click', () => {
      const total = this.g.checkout.total;
      if (total > 5000) {
        $('pin-box').hidden = false;
        this.pin = '';
        this.renderPin();
        this.g.audio.terminal();
        return;
      }
      this.tryCard();
    });
    for (const b of document.querySelectorAll('[data-pin]')) {
      b.addEventListener('click', () => {
        const k = b.dataset.pin;
        if (k === 'c') this.pin = '';
        else if (k === 'ok') return this.tryCard();
        else if (this.pin.length < 4) this.pin += k;
        this.g.audio.terminal();
        this.renderPin();
      });
    }
    $('cash-pay').addEventListener('click', () => {
      const r = this.g.payCash(this.given);
      if (!r.ok) return this.payError(r.error);
      this.paid(r.receipt, r.receipt.payment);
    });
    $('cash-exact').addEventListener('click', () => {
      // hand over the smallest set of coins/notes that covers the bill
      const w = { ...this.g.state.wallet };
      this.given = {};
      let rest = this.g.checkout.total;
      for (const d of DENOMS) {
        while (rest >= d && w[d] > 0) {
          rest -= d; w[d]--;
          this.given[d] = (this.given[d] || 0) + 1;
        }
      }
      if (rest > 0) {
        // not exact: add the smallest coin or note that covers the rest
        const up = [...DENOMS].reverse().find((d) => d >= rest && w[d] > 0);
        if (up) this.given[up] = (this.given[up] || 0) + 1;
      }
      this.renderCash();
    });
  }

  showPayTab(tab) {
    for (const b of document.querySelectorAll('[data-paytab]')) b.setAttribute('aria-selected', b.dataset.paytab === tab ? 'true' : 'false');
    $('pay-card').hidden = tab !== 'card';
    $('pay-cash').hidden = tab !== 'cash';
  }

  renderPin() {
    $('pin-dots').textContent = '●'.repeat(this.pin.length) + '○'.repeat(4 - this.pin.length);
  }

  tryCard() {
    const r = this.g.payCard(this.pin);
    if (!r.ok) {
      this.pin = '';
      this.renderPin();
      return this.payError(r.error);
    }
    this.paid(r.receipt, r.receipt.payment);
  }

  payError(msg) {
    $('pay-error').textContent = msg;
    this.g.audio.error();
  }

  renderCash() {
    const g = this.g;
    if (!g) return;
    const w = g.state.wallet;
    const wallet = $('cash-wallet');
    wallet.replaceChildren(
      ...DENOMS.filter((d) => (w[d] || 0) - (this.given[d] || 0) > 0).map((d) => {
        const b = el('button', 'money ' + (d >= 500 ? 'note' : 'coin') + ' d' + d);
        b.type = 'button';
        b.append(el('span', 'v', d >= 100 ? d / 100 + ' €' : d + ' ct'), el('span', 'c', '×' + ((w[d] || 0) - (this.given[d] || 0))));
        b.addEventListener('click', () => {
          this.given[d] = (this.given[d] || 0) + 1;
          g.audio.coin();
          this.renderCash();
        });
        return b;
      })
    );
    const given = $('cash-given');
    let sum = 0;
    const chips = [];
    for (const d of DENOMS) {
      const n = this.given[d] || 0;
      sum += n * d;
      for (let i = 0; i < n; i++) {
        const b = el('button', 'money small ' + (d >= 500 ? 'note' : 'coin') + ' d' + d, d >= 100 ? d / 100 + ' €' : d + ' ct');
        b.type = 'button';
        b.addEventListener('click', () => {
          this.given[d]--;
          this.renderCash();
        });
        chips.push(b);
      }
    }
    given.replaceChildren(...chips);
    const total = g.checkout.total;
    $('cash-sum').textContent = `Gegeben: ${euro(sum)} €` + (sum >= total ? ` · Rückgeld: ${euro(sum - total)} €` : ` · fehlen: ${euro(total - sum)} €`);
    $('cash-pay').disabled = sum < total;
    $('cash-total').textContent = euro(g.cash()) + ' €';
  }

  paid(receipt, payment) {
    $('pay-done').hidden = false;
    $('pay-done-text').textContent = payment.method === 'card' ? 'Zahlung erfolgt' : `Rückgeld: ${euro(payment.change)} €`;
    setTimeout(() => {
      this.showReceipt(receipt);
    }, 900);
  }

  // --- receipt ------------------------------------------------------------------------
  showReceipt(r) {
    $('receipt-paper').textContent = formatReceipt(r, this.data.meta);
    $('receipt-codes').innerHTML = receiptCodes(r);
    this.lastReceipt = r;
    this.open('receipt');
  }

  // --- end ---------------------------------------------------------------------------
  openEnd(sum) {
    const list = $('end-list');
    const rows = [];
    const add = (label, value, ok = null) => {
      const li = el('li', ok === null ? '' : ok ? 'ok' : 'miss');
      li.append(el('span', '', label), el('b', '', value));
      rows.push(li);
    };
    if (sum.receipt) {
      add('Bezahlt', euro(sum.receipt.total) + ' €' + (sum.receipt.payment.method === 'card' ? ' mit Karte' : ' bar'));
      if (sum.receipt.savings) add('Gespart mit Angeboten', euro(sum.receipt.savings) + ' €', true);
    } else add('Eingekauft', 'nichts', false);
    if (sum.list.items.length) {
      const done = sum.progress.filter((p) => p.have >= p.need).length;
      add(`Einkaufszettel „${sum.list.title}“`, `${done} von ${sum.progress.length} erledigt`, done === sum.progress.length);
    }
    add('Im Kofferraum', sum.trunk + ' Artikel', sum.trunk > 0);
    if (sum.pfand) add('Leergut zurückgegeben', euro(sum.pfand) + ' €', true);
    add('Einkaufswagen', sum.cartReturned ? 'zurückgebracht, Euro wieder da' : sum.coinLost ? 'stehen gelassen – der Euro ist weg' : 'keinen genommen', sum.cartReturned || (!sum.coinLost && null));
    if (sum.leftInCart) add('Vergessen', `${sum.leftInCart} Teile im Wagen auf dem Parkplatz`, false);
    const min = Math.max(1, sum.minutes);
    add('Dauer', `${min} ${min === 1 ? 'Minute' : 'Minuten'}, ${sum.walked} m zu Fuß`);
    add('Im Portemonnaie', euro(sum.cash) + ' € bar · Konto ' + euro(sum.card) + ' €');
    list.replaceChildren(...rows);
    $('end-receipt').hidden = !sum.receipt;
    if (sum.receipt) $('end-receipt').onclick = () => this.showReceipt(sum.receipt);
    this.open('end');
  }
}

// ---------------------------------------------------------------------------------------
const W = 40;
const pad = (s, n) => (s.length > n ? s.slice(0, n) : s + ' '.repeat(n - s.length));
const lpad = (s, n) => (s.length >= n ? s : ' '.repeat(n - s.length) + s);
const center = (s) => ' '.repeat(Math.max(0, Math.floor((W - s.length) / 2))) + s;
const line = (left, right, tail = '') => pad(left, W - 12) + lpad(right, 10) + ' ' + tail;

export function formatReceipt(r, meta) {
  const out = [];
  out.push(center('A M E K'), center(meta.market), ...meta.address.map(center), '', lpad('EUR', W - 2));
  for (const l of r.lines) {
    const code = l.vat === 7 ? 'A' : 'B';
    if (l.kind === 'loose') {
      out.push(l.name);
      out.push(line(`  ${kg(l.weight)} x ${euro(l.unit)} EUR/kg`, euro(l.total), code));
    } else if (l.qty > 1) {
      out.push(l.name);
      out.push(line(`  ${l.qty} x ${euro(l.unit)}`, euro(l.total), code));
    } else out.push(line(l.name, euro(l.total), code));
    // the article's EAN under it, and the short code for loose and bakery goods
    if (l.gtin) out.push(`  EAN ${l.gtin}` + (l.plu ? `  PLU ${l.plu}` : ''));
  }
  out.push('-'.repeat(W));
  out.push(line('zu zahlen', euro(r.total)));
  const p = r.payment;
  if (p.method === 'card') out.push(line('Kartenzahlung girocard', euro(p.amount)));
  else {
    out.push(line('Bar', euro(p.given)));
    out.push(line('Rückgeld', euro(p.change)));
  }
  out.push('-'.repeat(W));
  out.push(pad('MwSt', 6) + lpad('%', 4) + lpad('MwSt', 9) + lpad('Netto', 10) + lpad('Brutto', 10));
  let tv = 0, tn = 0, tg = 0;
  for (const v of r.vat) {
    out.push(pad(v.code, 6) + lpad(String(v.rate), 4) + lpad(euro(v.vat), 9) + lpad(euro(v.net), 10) + lpad(euro(v.gross), 10));
    tv += v.vat; tn += v.net; tg += v.gross;
  }
  out.push(pad('Summe', 10) + lpad(euro(tv), 9) + lpad(euro(tn), 10) + lpad(euro(tg), 10));
  out.push('-'.repeat(W));
  if (r.savings > 0) out.push(center(`Sie haben heute ${euro(r.savings)} EUR gespart!`), '');
  if (p.method === 'card') {
    out.push(center('Kartenzahlung'), center('girocard kontaktlos'));
    out.push(line('Betrag EUR', euro(p.amount)));
    out.push(`Terminal-ID 54418237   TA-Nr ${String(r.bon).padStart(6, '0')}`);
    out.push(center(p.pin ? 'Zahlung mit PIN erfolgt' : 'Zahlung erfolgt'), '-'.repeat(W));
  }
  const d = r.date;
  const date = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  out.push(`${date}  ${time}   Kasse ${r.kasse}   Bon ${r.bon}`);
  out.push(`TSE-Transaktion  ${r.tse}`);
  out.push(`TSE-Start  ${iso(r.tseStart)}`);
  out.push(`TSE-Stopp  ${iso(d)}`);
  out.push(`TSE-Seriennr.  7f3a92c1e0d4b5a6`);
  out.push('', center('Vielen Dank für Ihren Einkauf!'), center('Bis bald bei AMEK.'));
  return out.join('\n');
}

// Under the text: a barcode with till, receipt number and date (scanned for
// returns), and the TSE check code German receipts carry since 2020, in the
// DSFinV-K layout. The signature is made up: there is no real TSE in a game.
export function receiptCodes(r) {
  const z = (n, w) => String(n).padStart(w, '0');
  const d = r.date;
  const body = `29${z(r.kasse, 2)}${z(r.bon % 10000, 4)}${z(d.getDate(), 2)}${z(d.getMonth() + 1, 2)}`;
  const bon = body + checkDigit(body);
  const ink = '#222', paper = '#f7f2e6';
  let qr = '';
  try {
    const q = qrcode(0, 'L');
    q.addData(tseCode(r));
    q.make();
    qr = q.createSvgTag({ cellSize: 2, margin: 0, scalable: true, alt: { text: 'TSE-Prüfcode', id: 'tse-qr' } }).replace(/fill="black"/, `fill="${ink}"`).replace(/fill="white"/, `fill="${paper}"`);
  } catch {
    // a code too long for a QR symbol: leave it off rather than break the receipt
  }
  return (
    `<figure class="code-bon">${ean13Svg(bon, { module: 2, height: 44, ink, paper })}<figcaption>Bon-Code für Umtausch und Rückgabe</figcaption></figure>` +
    (qr ? `<figure class="code-tse">${qr}<figcaption>TSE-Prüfcode</figcaption></figure>` : '')
  );
}

// V0;Kasse;Prozesstyp;Prozessdaten;Transaktion;Signaturzähler;Start;Ende;Algorithmus;Zeitformat;Signatur;Schlüssel
function tseCode(r) {
  const two = (c) => (c / 100).toFixed(2);
  const gross = { 19: 0, 7: 0 };
  for (const v of r.vat) gross[v.rate] = v.gross;
  const pay = r.payment.method === 'card' ? `${two(r.payment.amount)}:Unbar` : `${two(r.total)}:Bar`;
  const utc = (t) => t.toISOString().replace(/\.\d+Z$/, '.000Z');
  // deterministic stand-ins for the ECDSA signature and public key
  let seed = r.tse;
  const bytes = (n) => btoa(String.fromCharCode(...Array.from({ length: n }, () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 16) & 255)));
  return ['V0', `AMEK-0815-K${r.kasse}`, 'Kassenbeleg-V1', `Beleg^${two(gross[19])}_${two(gross[7])}_0.00_0.00_0.00^${pay}`, r.tse, r.tse * 2 + 1, utc(r.tseStart), utc(r.date), 'ecdsa-plain-SHA384', 'unixTime', bytes(96), bytes(97)].join(';');
}

function iso(d) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
}

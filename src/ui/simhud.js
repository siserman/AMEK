// HUD for watching the market: clock, time-lapse speed, camera presets,
// the day's numbers with two small bar charts, an event ticker, the card of
// the person being followed, and recording the view as a video.
import { DAY, WEEKDAYS, OPEN, CLOSE } from '../sim/clock.js';

const $ = (id) => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
// amounts are kept in cents, like everywhere else in AMEK
const euro = (c, d = 0) => (c / 100).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' €';
const num = (v) => Math.round(v).toLocaleString('de-DE');
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')} min`;

export class SimHud {
  constructor({ sim, cam, renderer }) {
    this.sim = sim;
    this.cam = cam;
    this.renderer = renderer;
    this.speed = 60;
    this.skipping = false;
    this.t = 1;
    this.chartT = 9;
    this.root = $('sim-hud');
    this.tip = $('viz-tip');

    for (const b of document.querySelectorAll('[data-speed]')) b.addEventListener('click', () => this.setSpeed(+b.dataset.speed));
    $('sim-skip').addEventListener('click', () => this.skip());
    for (const b of document.querySelectorAll('[data-cam]')) b.addEventListener('click', () => this.camera(b.dataset.cam));
    $('follow-next').addEventListener('click', () => this.followSomeone());
    $('follow-stop').addEventListener('click', () => this.camera('overview'));
    $('sim-play').addEventListener('click', () => location.reload());
    const toggle = $('sim-panel-toggle');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open);
      $('sim-panel').classList.toggle('collapsed', !open);
      this.chartT = 9;
    });
    if (innerWidth < 760) toggle.click();
    // recording only when AMEK runs on its own page (not inside a frame)
    if (window.top === window.self && window.MediaRecorder && HTMLCanvasElement.prototype.captureStream) {
      $('sim-rec').hidden = false;
      $('sim-rec').addEventListener('click', () => (this.rec ? this.stopRec() : this.startRec()));
    }
    addEventListener('keydown', (e) => {
      if (this.root.hidden || e.target.closest?.('input,textarea')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.setSpeed(this.speed ? 0 : this.lastSpeed || 60);
      }
      const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(e.code);
      if (n >= 0) this.setSpeed([1, 10, 60, 300, 1800][n]);
    });
    const hideTip = () => $('sim-tip').classList.add('gone');
    setTimeout(hideTip, 14000);
    renderer.domElement.addEventListener('pointerdown', () => setTimeout(hideTip, 3000), { once: true });
  }

  // the panel starts below the top bar, however that bar wrapped
  layout() {
    const bottom = this.root.querySelector('.sim-top').getBoundingClientRect().bottom;
    $('sim-panel').style.top = Math.round(bottom + 8) + 'px';
  }

  show() {
    this.root.hidden = false;
    this.layout();
    addEventListener('resize', () => this.layout());
    this.cam.active = true;
    this.update(1);
  }

  setSpeed(v) {
    if (this.skipping) return;
    if (this.speed) this.lastSpeed = this.speed;
    this.speed = v;
    for (const b of document.querySelectorAll('[data-speed]')) b.setAttribute('aria-pressed', +b.dataset.speed === v);
  }

  camera(name) {
    for (const b of document.querySelectorAll('[data-cam]')) b.setAttribute('aria-pressed', b.dataset.cam === name);
    if (name === 'follow') return this.followSomeone();
    this.following = null;
    $('sim-follow').hidden = true;
    this.cam.preset(name);
  }

  // prefer someone inside the shop, then anyone moving, then anyone at all
  followSomeone() {
    const all = this.sim.followable().filter((a) => a !== this.following);
    if (!all.length) {
      this.ticker([{ t: this.sim.clock.t, text: 'Gerade ist niemand unterwegs.' }]);
      return;
    }
    const inside = all.filter((a) => a.inside || (a.onDuty && a.mesh.visible));
    const pool = inside.length ? inside : all;
    const a = pool[Math.floor(Math.random() * pool.length)];
    this.following = a;
    this.cam.followAgent(a);
    $('sim-follow').hidden = false;
    for (const b of document.querySelectorAll('[data-cam]')) b.setAttribute('aria-pressed', b.dataset.cam === 'follow');
    this.followCard();
  }

  followCard() {
    const a = this.following;
    if (!a) return;
    if (a.done) {
      this.followSomeone();
      return;
    }
    const staff = !!a.def;
    $('follow-kind').textContent = staff ? 'Team AMEK' : a.byCar ? 'Kundschaft · mit dem Auto' : 'Kundschaft · zu Fuß';
    $('follow-name').textContent = a.label;
    $('follow-act').textContent = a.activity || (staff ? 'im Dienst' : 'unterwegs');
    $('follow-cart').textContent = staff
      ? a.onDuty ? 'im Dienst' : 'außer Dienst'
      : a.bought.length ? `${a.bought.length} Artikel im ${a.cart ? 'Wagen' : 'Korb'} · ${euro(a.value, 2)}` : `${a.wanted} Sachen auf dem Zettel`;
  }

  // jump to 06:30 of the next working day, drawing the clock along the way
  async skip() {
    if (this.skipping) return;
    const sim = this.sim, c = sim.clock;
    let target = c.day * DAY + 6.5 * 3600;
    if (target <= c.t + 600) target += DAY;
    while (Math.floor(target / DAY) % 7 === 6) target += DAY;
    this.skipping = true;
    const btn = $('sim-skip');
    const label = btn.innerHTML;
    btn.disabled = true;
    this.root.classList.add('skipping');
    while (c.t < target - 1) {
      sim.advance(Math.min(1800, target - c.t));
      btn.textContent = '… ' + c.hhmm();
      this.update(1);
      await new Promise((r) => requestAnimationFrame(r));
    }
    sim.sync(0.5, 1800);
    btn.innerHTML = label;
    btn.disabled = false;
    this.root.classList.remove('skipping');
    this.skipping = false;
    this.chartT = 9;
  }

  update(dt) {
    this.t += dt;
    this.chartT += dt;
    if (this.t < 0.25) return;
    this.t = 0;
    const sim = this.sim, c = sim.clock, s = sim.snapshot();
    $('sim-week').textContent = `Woche ${c.week} · Tag ${c.day + 1}`;
    $('sim-time').textContent = c.label();
    const h = c.hour;
    const state = !c.workday ? 'Sonntag · geschlossen' : c.open ? `geöffnet bis ${CLOSE}:00` : h < OPEN ? `öffnet um ${OPEN}:00` : 'geschlossen';
    $('sim-open').textContent = state;
    $('sim-open').classList.toggle('on', c.open);
    this.kpis(s);
    this.ticker(sim.events);
    this.followCard();
    if (this.chartT > 1.5 && !$('sim-panel').classList.contains('collapsed')) {
      this.chartT = 0;
      this.charts();
    }
  }

  kpis(s) {
    const rows = [
      ['Bedient', num(s.served)],
      ['Umsatz', euro(s.revenue)],
      ['Im Markt', num(s.inside)],
      ['Ø Bon', s.served ? euro(s.revenue / s.served, 2) : '–'],
      ['Kassen offen', num(s.tillsOpen)],
      ['In der Schlange', num(s.queue)],
      ['Ø Wartezeit', s.avgWait ? mmss(s.avgWait) : '–'],
      ['Regale gefüllt', Math.round(s.fill * 100) + ' %'],
      ['Parkplatz', `${s.parked} / ${s.bays}`],
      ['Team im Dienst', num(s.staffOn)],
    ];
    const dl = $('sim-kpis');
    if (dl.children.length !== rows.length) {
      dl.replaceChildren(
        ...rows.map(() => {
          const d = document.createElement('div');
          d.append(document.createElement('dt'), document.createElement('dd'));
          return d;
        })
      );
    }
    rows.forEach(([k, v], i) => {
      const [dt, dd] = dl.children[i].children;
      if (dt.textContent !== k) dt.textContent = k;
      if (dd.textContent !== v) dd.textContent = v;
    });
  }

  ticker(events) {
    const ol = $('sim-ticker');
    const top = events.slice(0, 4);
    const key = top.map((e) => e.t + e.text).join('|');
    if (key === this.tickKey) return;
    this.tickKey = key;
    ol.replaceChildren(
      ...top.map((e) => {
        const li = document.createElement('li');
        const t = document.createElement('time');
        t.textContent = this.sim.clock.hhmm(e.t);
        li.append(t, ' ', e.text);
        return li;
      })
    );
  }

  charts() {
    const sim = this.sim, c = sim.clock;
    const hourly = sim.stats.hourly;
    const hours = [];
    for (let h = OPEN; h < CLOSE; h++) {
      hours.push({
        value: hourly[h],
        axis: h % 3 === 1 ? String(h) : '',
        tip: `${h}–${h + 1} Uhr: <b>${hourly[h]}</b> Kund:innen bezahlt`,
        name: `${h} Uhr`,
      });
    }
    bars($('chart-hour'), hours, { fmt: num, empty: 'Noch niemand an der Kasse', tip: this.tip });
    const days = [...sim.stats.history, { ...sim.stats.today, today: true }].slice(-14);
    const daily = days.map((d) => {
      const date = new Date(c.base + d.day * DAY * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      const wd = WEEKDAYS[d.weekday];
      return {
        value: d.revenue,
        axis: d.today ? 'heute' : wd,
        name: `${wd}, ${date}`,
        tip:
          d.weekday === 6
            ? `${wd}, ${date}: geschlossen`
            : `${wd}, ${date}${d.today ? ' (bis jetzt)' : ''}<br><b>${euro(d.revenue)}</b> · ${num(d.served)} Kund:innen` +
              (d.served ? ` · Ø ${euro(d.revenue / d.served, 2)}` : ''),
      };
    });
    bars($('chart-day'), daily, { fmt: (v) => euro(v), empty: 'Der erste Tag läuft noch', tip: this.tip });
  }

  // --- recording: the canvas plus a time stamp, as WebM -------------------------
  startRec() {
    const src = this.renderer.domElement;
    const scale = Math.min(1, 1280 / src.width);
    const cv = document.createElement('canvas');
    cv.width = Math.round((src.width * scale) / 2) * 2;
    cv.height = Math.round((src.height * scale) / 2) * 2;
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(cv.captureStream(30), { mimeType: mime, videoBitsPerSecond: 8e6 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `amek-zeitraffer-${this.sim.clock.date().toISOString().slice(0, 10)}.${mime.includes('mp4') ? 'mp4' : 'webm'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };
    rec.start(1000);
    this.rec = { rec, cv, ctx: cv.getContext('2d') };
    $('sim-rec').textContent = 'Aufnahme beenden';
    $('sim-rec').classList.add('recording');
  }

  stopRec() {
    this.rec.rec.stop();
    this.rec = null;
    $('sim-rec').textContent = 'Aufnehmen';
    $('sim-rec').classList.remove('recording');
  }

  // called right after each render, while the frame is still in the canvas
  afterRender() {
    if (!this.rec) return;
    const { cv, ctx } = this.rec;
    ctx.drawImage(this.renderer.domElement, 0, 0, cv.width, cv.height);
    const k = cv.height / 720;
    const text = `${this.sim.clock.label()}${this.speed > 1 ? ' · ' + this.speed + '×' : ''}`;
    ctx.font = `800 ${Math.round(26 * k)}px Archivo, sans-serif`;
    const w = ctx.measureText(text).width + 32 * k;
    ctx.fillStyle = 'rgba(13, 92, 99, 0.92)';
    ctx.fillRect(20 * k, cv.height - 70 * k, w, 48 * k);
    ctx.fillStyle = '#ffb000';
    ctx.fillRect(20 * k, cv.height - 26 * k, w, 4 * k);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 36 * k, cv.height - 37 * k);
  }
}

// A small single-series bar chart: bars rounded at the data end, square at the
// baseline, 2px apart, the peak labelled, every bar with a hover tooltip.
function bars(svg, data, { fmt, empty, tip }) {
  const W = svg.clientWidth || 260, H = 92, top = 16, base = H - 16;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', H);
  const max = Math.max(0, ...data.map((d) => d.value));
  const n = Math.max(data.length, 7);
  const slot = W / n;
  const bw = Math.min(24, slot - 2);
  const parts = [`<line class="axis" x1="0" x2="${W}" y1="${base + 0.5}" y2="${base + 0.5}"/>`];
  if (!max) parts.push(`<text class="empty" x="${W / 2}" y="${base / 2 + 8}" text-anchor="middle">${empty}</text>`);
  let peak = -1;
  data.forEach((d, i) => {
    if (max && d.value === max && peak < 0) peak = i;
  });
  data.forEach((d, i) => {
    const x = i * slot + (slot - bw) / 2;
    const h = max ? ((base - top) * d.value) / max : 0;
    if (h > 0.5) {
      const r = Math.min(4, bw / 2, h);
      const y = base - h;
      parts.push(
        `<path class="bar" d="M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${base}Z"/>`
      );
    }
    if (i === peak) parts.push(`<text class="val" x="${x + bw / 2}" y="${base - h - 4}" text-anchor="middle">${fmt(d.value)}</text>`);
    if (d.axis) parts.push(`<text class="tick" x="${x + bw / 2}" y="${H - 3}" text-anchor="middle">${d.axis}</text>`);
    parts.push(`<rect class="hit" data-i="${i}" x="${i * slot}" y="0" width="${slot}" height="${H}"/>`);
  });
  svg.innerHTML = parts.join('');
  svg.setAttribute('aria-label', data.map((d) => `${d.name}: ${fmt(d.value)}`).join(', '));
  if (!svg.dataset.bound) {
    svg.dataset.bound = '1';
    const showTip = (e) => {
      const hit = e.target.closest('.hit');
      if (!hit) return (tip.hidden = true);
      const d = svg._data[+hit.dataset.i];
      tip.innerHTML = d.tip;
      tip.hidden = false;
      const r = tip.getBoundingClientRect();
      tip.style.left = Math.min(innerWidth - r.width - 8, Math.max(8, e.clientX - r.width / 2)) + 'px';
      tip.style.top = Math.max(8, e.clientY - r.height - 14) + 'px';
      for (const h of svg.querySelectorAll('.hit')) h.classList.toggle('on', h === hit);
    };
    svg.addEventListener('pointermove', showTip);
    svg.addEventListener('pointerdown', showTip);
    svg.addEventListener('pointerleave', () => {
      tip.hidden = true;
      for (const h of svg.querySelectorAll('.hit')) h.classList.remove('on');
    });
  }
  svg._data = data;
}

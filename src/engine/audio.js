// Every sound is synthesised with WebAudio, so the game ships without audio files.
export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engine = null;
    this.cart = null;
  }

  // Browsers only allow sound after a user gesture.
  unlock() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
    this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.startLoops();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.7;
    return this.muted;
  }

  tone(freq, dur, { type = 'sine', vol = 0.2, at = 0, slide = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + at;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur, { vol = 0.2, at = 0, freq = 1200, q = 0.7, type = 'bandpass', sweep = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + at;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.linearRampToValueAtTime(freq + sweep, t + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.02);
  }

  beep() { this.tone(1760, 0.09, { type: 'square', vol: 0.06 }); }
  pick() { this.noise(0.08, { vol: 0.25, freq: 2400, q: 1.2 }); this.tone(320, 0.05, { vol: 0.05 }); }
  drop() { this.noise(0.12, { vol: 0.3, freq: 700, q: 0.8 }); }
  coin() {
    this.tone(2637, 0.25, { type: 'triangle', vol: 0.08 });
    this.tone(3520, 0.3, { type: 'triangle', vol: 0.05, at: 0.06 });
  }
  clack() { this.noise(0.18, { vol: 0.45, freq: 900, q: 2 }); this.noise(0.12, { vol: 0.3, freq: 2200, q: 3, at: 0.08 }); }
  door() { this.noise(1.0, { vol: 0.12, freq: 400, sweep: 900, q: 0.5 }); }
  gate() { this.tone(180, 0.12, { type: 'square', vol: 0.05 }); this.noise(0.2, { vol: 0.2, freq: 1500, q: 4, at: 0.05 }); }
  bottle(i = 0) {
    this.noise(0.25, { vol: 0.25, freq: 1800 + (i % 3) * 300, q: 6, at: 0 });
    this.tone(90, 0.3, { type: 'sawtooth', vol: 0.04, at: 0.05 });
  }
  printer() { for (let i = 0; i < 6; i++) this.noise(0.05, { vol: 0.15, freq: 3000, q: 8, at: i * 0.07 }); }
  chime() {
    this.tone(784, 0.6, { vol: 0.08, type: 'triangle' });
    this.tone(659, 0.6, { vol: 0.08, type: 'triangle', at: 0.35 });
    this.tone(523, 0.9, { vol: 0.08, type: 'triangle', at: 0.7 });
  }
  terminal() { this.tone(1200, 0.08, { vol: 0.06 }); this.tone(1500, 0.12, { vol: 0.06, at: 0.1 }); }
  success() { this.tone(988, 0.12, { vol: 0.07, type: 'triangle' }); this.tone(1319, 0.25, { vol: 0.07, type: 'triangle', at: 0.11 }); }
  error() { this.tone(220, 0.25, { type: 'square', vol: 0.05 }); }
  horn() { this.tone(370, 0.4, { type: 'sawtooth', vol: 0.08 }); this.tone(466, 0.4, { type: 'sawtooth', vol: 0.06 }); }
  trunk() { this.noise(0.3, { vol: 0.35, freq: 300, q: 1 }); }
  carDoor() { this.noise(0.15, { vol: 0.5, freq: 250, q: 1.5 }); this.noise(0.1, { vol: 0.3, freq: 1200, q: 2, at: 0.05 }); }

  startLoops() {
    const c = this.ctx;
    // engine: two detuned saws through a lowpass
    const eg = c.createGain();
    eg.gain.value = 0;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = o2.type = 'sawtooth';
    o1.frequency.value = 38; o2.frequency.value = 38.7;
    o1.connect(lp); o2.connect(lp);
    lp.connect(eg).connect(this.master);
    o1.start(); o2.start();
    this.engine = { g: eg, o1, o2, lp };

    // cart rattle: noise with a wobbling bandpass
    const cs = c.createBufferSource();
    cs.buffer = this.noiseBuf; cs.loop = true;
    const cf = c.createBiquadFilter();
    cf.type = 'bandpass'; cf.frequency.value = 2600; cf.Q.value = 3;
    const cg = c.createGain(); cg.gain.value = 0;
    cs.connect(cf).connect(cg).connect(this.master);
    cs.start();
    this.cart = { g: cg, f: cf };

    // store hum: low, constant, only indoors
    const hs = c.createBufferSource();
    hs.buffer = this.noiseBuf; hs.loop = true;
    const hf = c.createBiquadFilter();
    hf.type = 'lowpass'; hf.frequency.value = 180;
    const hg = c.createGain(); hg.gain.value = 0;
    hs.connect(hf).connect(hg).connect(this.master);
    hs.start();
    this.hum = hg;
  }

  update(dt, { engineOn = false, rpm = 0, cartSpeed = 0, indoors = false } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.engine) {
      this.engine.g.gain.setTargetAtTime(engineOn ? 0.05 + rpm * 0.05 : 0, t, 0.15);
      const f = 36 + rpm * 70;
      this.engine.o1.frequency.setTargetAtTime(f, t, 0.1);
      this.engine.o2.frequency.setTargetAtTime(f * 1.02, t, 0.1);
      this.engine.lp.frequency.setTargetAtTime(300 + rpm * 900, t, 0.1);
    }
    if (this.cart) {
      const v = Math.min(1, cartSpeed / 1.6);
      this.cart.g.gain.setTargetAtTime(v * 0.05, t, 0.08);
      this.cart.f.frequency.setTargetAtTime(2200 + Math.sin(t * 23) * 500 * v, t, 0.02);
    }
    if (this.hum) this.hum.gain.setTargetAtTime(indoors ? 0.06 : 0, t, 0.5);
  }
}

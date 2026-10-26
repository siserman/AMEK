// Keyboard, mouse (pointer lock) and touch, folded into a few actions.
//   use   E / left click / touch "E"     back  Q / touch "Q"
//   cart  F / touch "Wagen"              list  Tab
//   run   Shift   view  V   horn  H
const ACTIONS = {
  KeyE: 'use', KeyQ: 'back', KeyF: 'cart', Tab: 'list', KeyV: 'view', KeyH: 'horn',
  Enter: 'use', Space: 'brake', KeyM: 'mute',
};

export class Input {
  constructor(canvas, touchRoot) {
    this.canvas = canvas;
    this.keys = new Set();
    this.edges = new Set();
    this.lookX = 0;
    this.lookY = 0;
    this.locked = false;
    this.uiOpen = false; // overlays take the mouse back
    this.touchMode = matchMedia('(pointer: coarse)').matches;
    this.stick = { x: 0, y: 0 };
    this.touchHeld = new Set();

    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Tab') e.preventDefault();
      if (!this.keys.has(e.code)) {
        const a = ACTIONS[e.code];
        if (a) this.edges.add(a);
      }
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    // Mouse: pointer lock when the browser allows it; otherwise drag to look
    // and click to use (embedded frames may refuse pointer lock).
    this.lockFailed = false;
    this.hadLock = false;
    let drag = null;
    canvas.addEventListener('mousedown', (e) => {
      if (this.uiOpen || this.touchMode) return;
      if (this.locked) {
        if (e.button === 0) this.edges.add('use');
        if (e.button === 2) this.edges.add('back');
        return;
      }
      if (!this.lockFailed) this.requestLock();
      drag = { x: e.clientX, y: e.clientY, moved: 0, button: e.button };
    });
    addEventListener('mouseup', () => {
      if (drag && drag.moved < 6 && this.lockFailed && !this.uiOpen) this.edges.add(drag.button === 2 ? 'back' : 'use');
      drag = null;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      if (this.locked) this.hadLock = true;
    });
    document.addEventListener('pointerlockerror', () => {
      this.lockFailed = true;
    });
    addEventListener('mousemove', (e) => {
      if (this.locked) {
        this.lookX += e.movementX;
        this.lookY += e.movementY;
      } else if (drag && !this.uiOpen) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.moved += Math.abs(dx) + Math.abs(dy);
        this.lookX += dx * 1.4;
        this.lookY += dy * 1.4;
        drag.x = e.clientX;
        drag.y = e.clientY;
      }
    });

    if (touchRoot) this.initTouch(touchRoot);
  }

  requestLock() {
    if (this.touchMode || this.lockFailed) return;
    try {
      const p = this.canvas.requestPointerLock?.();
      if (p && p.catch) p.catch(() => (this.lockFailed = true));
    } catch (_) {
      this.lockFailed = true; // pointer lock is optional
    }
  }
  releaseLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  initTouch(root) {
    root.hidden = !this.touchMode;
    const pad = root.querySelector('[data-stick]');
    const knob = pad?.querySelector('i');
    let padId = null, lookId = null, lx = 0, ly = 0;
    const padRect = () => pad.getBoundingClientRect();
    const setStick = (e) => {
      const r = padRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      this.stick.x = dx; this.stick.y = -dy;
      if (knob) knob.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`;
    };
    pad?.addEventListener('pointerdown', (e) => { padId = e.pointerId; pad.setPointerCapture(e.pointerId); setStick(e); });
    pad?.addEventListener('pointermove', (e) => { if (e.pointerId === padId) setStick(e); });
    const endPad = (e) => {
      if (e.pointerId !== padId) return;
      padId = null; this.stick.x = this.stick.y = 0;
      if (knob) knob.style.transform = '';
    };
    pad?.addEventListener('pointerup', endPad);
    pad?.addEventListener('pointercancel', endPad);

    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.touchMode || e.pointerType === 'mouse' || lookId !== null) return;
      lookId = e.pointerId; lx = e.clientX; ly = e.clientY;
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== lookId) return;
      this.lookX += (e.clientX - lx) * 1.6; this.lookY += (e.clientY - ly) * 1.6;
      lx = e.clientX; ly = e.clientY;
    });
    const endLook = (e) => { if (e.pointerId === lookId) lookId = null; };
    this.canvas.addEventListener('pointerup', endLook);
    this.canvas.addEventListener('pointercancel', endLook);

    for (const b of root.querySelectorAll('[data-action]')) {
      const a = b.dataset.action;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.edges.add(a);
        this.touchHeld.add(a);
      });
      const up = () => this.touchHeld.delete(a);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('pointerleave', up);
    }
  }

  down(code) { return this.keys.has(code); }
  held(action) {
    if (this.touchHeld.has(action)) return true;
    for (const [code, a] of Object.entries(ACTIONS)) if (a === action && this.keys.has(code)) return true;
    return false;
  }
  take(action) {
    if (this.uiOpen) return false;
    if (this.edges.has(action)) {
      this.edges.delete(action);
      return true;
    }
    return false;
  }
  // x: right, y: forward, both in [-1, 1]
  axis() {
    let x = 0, y = 0;
    if (this.uiOpen) return { x, y };
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    x += this.stick.x; y += this.stick.y;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    return { x, y };
  }
  get running() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || Math.hypot(this.stick.x, this.stick.y) > 0.95;
  }
  endFrame() {
    this.edges.clear();
    this.lookX = this.lookY = 0;
  }
}

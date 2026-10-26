// Simulated time. t counts seconds from Monday 00:00 of the first week.
export const DAY = 86400;
export const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const OPEN = 7, CLOSE = 22; // Mo–Sa 7–22 Uhr

export class SimClock {
  constructor(monday, t = 5 * 3600) {
    this.base = monday.getTime();
    this.t = t;
  }
  get day() { return Math.floor(this.t / DAY); }
  get weekday() { return this.day % 7; }
  get hour() { return (this.t % DAY) / 3600; }
  get week() { return Math.floor(this.day / 7) + 1; }
  get workday() { return this.weekday < 6; }
  get open() { return this.workday && this.hour >= OPEN && this.hour < CLOSE; }
  date() { return new Date(this.base + this.t * 1000); }
  hhmm(t = this.t) {
    const h = Math.floor((t % DAY) / 3600), m = Math.floor((t % 3600) / 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
  label() {
    const d = this.date();
    return `${WEEKDAYS[this.weekday]}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} · ${this.hhmm()}`;
  }
  // seconds until the next given hour (today or tomorrow)
  until(hour) {
    const now = this.t % DAY, at = hour * 3600;
    return at > now ? at - now : DAY - now + at;
  }
}

// EAN-13 barcodes and GS1 Digital Link URLs for AMEK's GTINs.
// An EAN-13 is 95 modules: start guard 101, six digits whose L/G parity encodes
// the first digit, centre guard 01010, six R digits, end guard 101.

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

// GS1 check digit: weights 3 and 1 from the right, over the digits without it
export function checkDigit(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) sum += Number(digits[digits.length - 1 - i]) * (i % 2 === 0 ? 3 : 1);
  return String((10 - (sum % 10)) % 10);
}

export function isValidGtin(code) {
  return /^\d{8}$|^\d{12,14}$/.test(code) && checkDigit(code.slice(0, -1)) === code.slice(-1);
}

// the 95 modules as a string of 0 and 1
export function ean13Modules(code) {
  if (!/^\d{13}$/.test(code) || !isValidGtin(code)) throw new Error('not a valid EAN-13: ' + code);
  const parity = PARITY[code[0]];
  let bits = '101';
  for (let i = 1; i <= 6; i++) bits += (parity[i - 1] === 'L' ? L : G)[code[i]];
  bits += '01010';
  for (let i = 7; i <= 12; i++) bits += R[code[i]];
  return bits + '101';
}

// SVG with quiet zones, longer guard bars and the human-readable digits
export function ean13Svg(code, { module = 2, height = 60, ink = '#000', paper = '#fff', font = 'ui-monospace, monospace' } = {}) {
  const bits = ean13Modules(code);
  const quietL = 11, quietR = 7, text = 10 * (module / 2) + 4;
  const w = (quietL + 95 + quietR) * module, h = height + text;
  const guard = (i) => i < 3 || (i >= 45 && i < 50) || i >= 92;
  let bars = '';
  for (let i = 0; i < 95; ) {
    if (bits[i] === '0') {
      i++;
      continue;
    }
    let n = 1;
    while (bits[i + n] === '1' && guard(i + n) === guard(i)) n++;
    bars += `<rect x="${(quietL + i) * module}" y="0" width="${n * module}" height="${guard(i) ? height + text / 2 : height}"/>`;
    i += n;
  }
  const fs = 9 * (module / 2) + 3, y = height + text - 2;
  const digits =
    `<text x="${(quietL - 2) * module}" y="${y}" text-anchor="end">${code[0]}</text>` +
    `<text x="${(quietL + 3 + 21) * module}" y="${y}" text-anchor="middle" textLength="${40 * module}">${code.slice(1, 7)}</text>` +
    `<text x="${(quietL + 50 + 21) * module}" y="${y}" text-anchor="middle" textLength="${40 * module}">${code.slice(7)}</text>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="EAN-13 ${code}">` +
    `<rect width="${w}" height="${h}" fill="${paper}"/><g fill="${ink}">${bars}</g>` +
    `<g fill="${ink}" font-family="${font}" font-size="${fs}">${digits}</g></svg>`
  );
}

// GS1 Digital Link: the GTIN as a web address, what a QR code on the pack carries
export function digitalLink(gtin, base = 'https://amek.example') {
  return `${base}/01/${gtin.padStart(14, '0')}`;
}

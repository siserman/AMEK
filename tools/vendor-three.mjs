// Vendors three.js into vendor/: the four builds minified (core, the WebGL
// module, the WebGPU module and TSL) and the addons AMEK uses, with every
// import rewritten to a relative path so the browser needs no import map.
//   npm pack three@<version> && tar xzf three-<version>.tgz
//   node tools/vendor-three.mjs path/to/package
// Needs npx (esbuild is fetched on the fly).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = path.resolve(process.argv[2] || 'package');
const vendor = path.join(root, 'vendor');
const addonsOut = path.join(vendor, 'addons');

// addons and what needs them: Einfach/Hoch run on WebGL, Ultra on WebGPU
const ADDONS = [
  'environments/RoomEnvironment.js',
  'postprocessing/EffectComposer.js',
  'postprocessing/RenderPass.js',
  'postprocessing/GTAOPass.js',
  'postprocessing/UnrealBloomPass.js',
  'postprocessing/SMAAPass.js',
  'postprocessing/OutputPass.js',
  'objects/Sky.js',
  'objects/SkyMesh.js',
  'tsl/display/SSGINode.js',
  'tsl/display/SSRNode.js',
  'tsl/display/TRAANode.js',
  'tsl/display/GTAONode.js',
  'tsl/display/BloomNode.js',
  'tsl/display/SMAANode.js',
];
const BUILDS = { 'three.core.js': 'three.core.min.js', 'three.module.js': 'three.module.min.js', 'three.webgpu.js': 'three.webgpu.min.js', 'three.tsl.js': 'three.tsl.min.js' };
const BARE = { three: 'three.module.min.js', 'three/webgpu': 'three.webgpu.min.js', 'three/tsl': 'three.tsl.min.js' };

const { version } = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'), 'utf8'));
fs.rmSync(addonsOut, { recursive: true, force: true });
for (const f of fs.readdirSync(vendor)) if (/^three\..*\.js$|^RoomEnvironment\.js$/.test(f)) fs.rmSync(path.join(vendor, f));

// builds: minify, then point their imports at the minified siblings
for (const [src, out] of Object.entries(BUILDS)) {
  const dest = path.join(vendor, out);
  execFileSync('npx', ['-y', 'esbuild@0.25.10', path.join(pkg, 'build', src), '--minify', '--format=esm', '--legal-comments=inline', `--outfile=${dest}`], { stdio: 'inherit' });
  let code = fs.readFileSync(dest, 'utf8');
  for (const [a, b] of Object.entries(BUILDS)) code = code.replaceAll(`"./${a}"`, `"./${b}"`).replaceAll(`'./${a}'`, `'./${b}'`);
  for (const [spec, file] of Object.entries(BARE)) code = code.replaceAll(`from"${spec}"`, `from"./${file}"`).replaceAll(`from "${spec}"`, `from "./${file}"`);
  fs.writeFileSync(dest, code);
}

// addons: copy with their relative dependencies, rewrite bare imports
const seen = new Set();
const copy = (rel) => {
  if (seen.has(rel)) return;
  seen.add(rel);
  let code = fs.readFileSync(path.join(pkg, 'examples/jsm', rel), 'utf8');
  const up = path.relative(path.dirname(path.join(addonsOut, rel)), vendor).split(path.sep).join('/');
  code = code.replace(/(from\s*|import\s*)(['"])([^'"]+)\2/g, (m, kw, q, spec) => {
    if (spec in BARE) return `${kw}${q}${up}/${BARE[spec]}${q}`;
    if (spec.startsWith('.')) copy(path.posix.join(path.posix.dirname(rel), spec));
    return m;
  });
  const dest = path.join(addonsOut, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, code);
};
ADDONS.forEach(copy);
fs.copyFileSync(path.join(pkg, 'LICENSE'), path.join(vendor, 'THREE-LICENSE'));
fs.writeFileSync(path.join(vendor, 'THREE-VERSION'), version + '\n');
console.log(`three ${version}: ${Object.keys(BUILDS).length} builds, ${seen.size} addon files`);

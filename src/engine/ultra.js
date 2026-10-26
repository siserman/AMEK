// Ultra: three.js' WebGPU renderer with screen-space global illumination (light
// bouncing off the floor and the shelves, plus ambient occlusion), reflections
// in the shop floor and glass, bloom, and temporal anti-aliasing. Temporal
// effects smear when everything races past in a time-lapse, so a lighter graph
// takes over at speed: GTAO, reflections, bloom and SMAA.
// Loaded only when Ultra is chosen; the renderer is picked at startup.
import * as THREE from '../../vendor/three.webgpu.min.js';
import { pass, mrt, output, normalView, diffuseColor, velocity, metalness, roughness, vec3, vec4, sample, packNormalToRGB, unpackRGBToNormal } from '../../vendor/three.tsl.min.js';
import { ssgi } from '../../vendor/addons/tsl/display/SSGINode.js';
import { ssr } from '../../vendor/addons/tsl/display/SSRNode.js';
import { traa } from '../../vendor/addons/tsl/display/TRAANode.js';
import { ao } from '../../vendor/addons/tsl/display/GTAONode.js';
import { bloom } from '../../vendor/addons/tsl/display/BloomNode.js';
import { smaa } from '../../vendor/addons/tsl/display/SMAANode.js';
import { SkyMesh } from '../../vendor/addons/objects/SkyMesh.js';

export const PMREMGenerator = THREE.PMREMGenerator;

// A WebGPU renderer, or null when this browser has no WebGPU (then AMEK starts
// on "Hoch" instead). A silent fallback to WebGL2 would be too slow for this.
export async function createRenderer() {
  if (!navigator.gpu) return null;
  const renderer = new THREE.WebGPURenderer({ antialias: false, powerPreference: 'high-performance' });
  await renderer.init();
  if (!renderer.backend.isWebGPUBackend) {
    renderer.dispose();
    return null;
  }
  return renderer;
}

export class UltraPipeline {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.pipeline = new THREE.RenderPipeline(renderer);
    this.graphs = new Map();
    this.camera = null;
    this.fast = false;
    this.blooms = [];
  }

  // one node graph per camera (the player's, and the watch-mode orbit camera)
  graph(camera) {
    let g = this.graphs.get(camera);
    if (g) return g;
    const scenePass = pass(this.scene, camera);
    // WebGPU allows 32 bytes of colour targets per pixel by default: four
    // targets, with metalness riding in the diffuse alpha and roughness in the
    // normal's
    scenePass.setMRT(mrt({ output, diffuse: vec4(diffuseColor.rgb, metalness), normal: vec4(packNormalToRGB(normalView), roughness), velocity }));
    const color = scenePass.getTextureNode('output');
    const diffuse = scenePass.getTextureNode('diffuse');
    const depth = scenePass.getTextureNode('depth');
    const normalTex = scenePass.getTextureNode('normal');
    const vel = scenePass.getTextureNode('velocity');
    for (const name of ['diffuse', 'normal']) scenePass.getTexture(name).type = THREE.UnsignedByteType;
    const normal = sample((uv) => unpackRGBToNormal(normalTex.sample(uv).rgb));

    // reflections: the polished floor, glass, freezer lids, car paint
    const refl = ssr(color, depth, normal, { metalnessNode: diffuse.a, roughnessNode: normalTex.a, reflectNonMetals: true, diffuseNode: diffuse.rgb, camera });
    refl.maxDistance.value = 9;
    refl.thickness.value = 0.3;
    refl.intensity.value = 1;
    refl.quality.value = 0.5;
    refl.resolutionScale = 0.5;

    // full quality: bounce light and AO from SSGI, resolved over time by TRAA
    const gi = ssgi(color, depth, normal, camera);
    gi.sliceCount.value = 2;
    gi.stepCount.value = 8;
    gi.radius.value = 5;
    gi.thickness.value = 0.6;
    gi.aoIntensity.value = 2.2;
    gi.giIntensity.value = 8;
    const lit = color.rgb.mul(gi.getAONode()).add(diffuse.rgb.mul(gi.getGINode().rgb));
    const full = this.finish(vec4(lit.add(refl.rgb), color.a));

    // at speed: per-frame GTAO and SMAA, nothing that needs earlier frames
    const occl = ao(depth, normal, camera);
    occl.resolutionScale = 0.75;
    occl.radius.value = 0.8;
    occl.scale.value = 1.6;
    occl.thickness.value = 1.2;
    const quick = this.finish(vec4(color.rgb.mul(occl.getTextureNode().r).add(refl.rgb), color.a));

    g = { full: traa(full, depth, vel, camera), fast: smaa(quick), gi, refl, occl };
    this.graphs.set(camera, g);
    return g;
  }

  finish(node) {
    const glow = bloom(node, 0.5, 0.45, 1.1);
    this.blooms.push(glow);
    return node.add(glow);
  }

  setBloom(strength, threshold) {
    for (const b of this.blooms) {
      b.strength.value = strength;
      b.threshold.value = threshold;
    }
  }

  render(camera) {
    const g = this.graph(camera);
    const out = this.fast ? g.fast : g.full;
    if (this.pipeline.outputNode !== out) {
      this.pipeline.outputNode = out;
      this.pipeline.needsUpdate = true;
    }
    this.pipeline.render();
  }
}

// the same physical sky as "Hoch", as a node material (clouds included)
export function makeSky() {
  const sky = new SkyMesh();
  sky.scale.setScalar(520);
  sky.renderOrder = -1;
  sky.turbidity.value = 5.5;
  sky.rayleigh.value = 1.6;
  sky.mieCoefficient.value = 0.006;
  sky.mieDirectionalG.value = 0.82;
  sky.cloudCoverage.value = 0.5;
  sky.cloudDensity.value = 0.45;
  const base = sky.material.colorNode;
  sky.material.colorNode = vec4(base.rgb.mul(0.62).add(vec3(0.006, 0.009, 0.022)), 1);
  return sky;
}

import * as THREE from 'three';
import type { Rect } from '../game/sparkleField';
import type { LocalLights } from './localLights';

const SUN = new THREE.Color('#fff2c8');
const PATCHES = 6;
const BEAM_SPARKLES = 14;
const BEAM_DEPTH = 9;

/** A small round, soft-edged dot texture, so the beam's sparkles are not squares. */
function softDot(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

/**
 * The Sunlit reef's light: the shimmering surface above it (a bright band
 * with a wavy, moving edge), sunlight patterns dancing on a backdrop behind
 * the garden, soft patches of sun drifting over the seabed (local lights,
 * so the corals and rocks catch them), and the sunbeam: one gap in the
 * surface where a warm column of light pours down with sparkles rising up
 * it, the way out at the end of the journey. Drawn with normal blending:
 * added light vanishes in water this bright.
 */
export class ReefView {
  readonly group = new THREE.Group();
  private readonly materials: THREE.ShaderMaterial[] = [];
  private time = 0;
  private readonly sparkles: THREE.Points;
  private readonly sparklePos: Float32Array;

  constructor(
    private readonly rect: Rect,
    private readonly beam: { x: number; y: number },
  ) {
    const w = rect.maxX - rect.minX + 12;
    const cx = (rect.minX + rect.maxX) / 2;

    const surface = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          // The surface line ripples; above it the bright sky-lit water, below it a soft glow.
          float x = vUv.x * 60.0;
          float line = 0.32 + 0.025 * sin(x * 0.9 + uTime * 1.3) + 0.018 * sin(x * 2.3 - uTime * 2.1);
          float above = smoothstep(line - 0.02, line + 0.02, vUv.y);
          float glow = exp(-abs(vUv.y - line) * 22.0);
          vec3 sky = mix(vec3(0.72, 0.92, 0.97), vec3(0.95, 0.99, 1.0), vUv.y);
          float a = above * 0.95 + glow * 0.6 + smoothstep(0.0, line, vUv.y) * 0.15;
          gl_FragColor = vec4(sky + glow * 0.3, min(1.0, a));
        }`,
    });
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(w, 8), surface);
    // The line sits at about a third of the band's height: on the reef's top edge.
    surf.position.set(cx, rect.maxY + 8 * (0.5 - 0.32), -0.8);
    this.group.add(surf);
    this.materials.push(surface);

    const caustics = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vPos; void main(){ vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        varying vec2 vPos;
        uniform float uTime;
        float cell(vec2 p) {
          // Two drifting wave fields crossed: bright where they meet, like sun through ripples.
          float a = sin(p.x * 0.9 + uTime * 0.7 + sin(p.y * 0.6 + uTime * 0.4) * 1.8);
          float b = sin(p.y * 1.1 - uTime * 0.5 + sin(p.x * 0.5 - uTime * 0.3) * 1.6);
          return pow(max(0.0, 1.0 - abs(a + b) * 0.9), 3.0);
        }
        void main() {
          float c = cell(vPos * 0.8) * 0.7 + cell(vPos * 1.6 + 3.0) * 0.3;
          float fade = smoothstep(-11.0, -3.0, vPos.y) * smoothstep(11.0, 3.0, vPos.y);
          float a = c * fade * 0.22;
          gl_FragColor = vec4(vec3(1.0, 0.97, 0.85) * a, a);
        }`,
    });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, rect.maxY - rect.minY), caustics);
    back.position.set(cx, (rect.minY + rect.maxY) / 2, -6);
    this.group.add(back);
    this.materials.push(caustics);

    // The sunbeam: a soft column of warm light, brightest at the gap, gently swaying.
    const ray = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          // Wider at the bottom: the light spreads as it falls.
          float hw = mix(0.22, 0.5, 1.0 - vUv.y);
          float x = abs(vUv.x - 0.5 + 0.03 * sin(vUv.y * 5.0 + uTime * 0.8));
          float edge = 1.0 - smoothstep(hw * 0.45, hw, x);
          float streak = 0.75 + 0.25 * sin(vUv.x * 30.0 + uTime * 0.6) * sin(vUv.x * 13.0 - uTime * 0.4);
          float a = edge * streak * pow(vUv.y, 1.1) * 0.95;
          gl_FragColor = vec4(vec3(1.0, 0.9, 0.55), a);
        }`,
    });
    const column = new THREE.Mesh(new THREE.PlaneGeometry(5, BEAM_DEPTH), ray);
    column.position.set(beam.x, beam.y - BEAM_DEPTH / 2 + 0.6, -0.4);
    this.group.add(column);
    this.materials.push(ray);
    // The gap itself: a bright, breathing glow on the surface line.
    const gap = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          float d = length((vUv - 0.5) * vec2(1.0, 2.2));
          float a = (1.0 - smoothstep(0.1, 0.5, d)) * (0.85 + 0.15 * sin(uTime * 2.0));
          gl_FragColor = vec4(1.0, 0.95, 0.7, a);
        }`,
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.4), gap);
    glow.position.set(beam.x, beam.y - 0.2, -0.3);
    this.group.add(glow);
    this.materials.push(gap);
    // Sparkles drifting up the beam, so it reads as somewhere to go.
    this.sparklePos = new Float32Array(BEAM_SPARKLES * 3);
    for (let i = 0; i < BEAM_SPARKLES; i++) {
      this.sparklePos[i * 3] = beam.x;
      this.sparklePos[i * 3 + 1] = beam.y - BEAM_DEPTH * (i / BEAM_SPARKLES);
      this.sparklePos[i * 3 + 2] = -0.2;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(this.sparklePos, 3));
    this.sparkles = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#fff3b0', size: 0.4, map: softDot(), transparent: true, opacity: 0.95, depthWrite: false }));
    this.sparkles.frustumCulled = false;
    this.group.add(this.sparkles);
  }

  update(dt: number, lights: LocalLights): void {
    this.time += dt;
    for (const m of this.materials) m.uniforms.uTime.value = this.time;
    // Sparkles rise up the beam and start again at its foot, each on its own little wave.
    for (let i = 0; i < BEAM_SPARKLES; i++) {
      const t = (this.time * 0.12 + i / BEAM_SPARKLES) % 1;
      this.sparklePos[i * 3] = this.beam.x + Math.sin(this.time * 1.3 + i * 2.4) * 1.1 * (1 - t * 0.5);
      this.sparklePos[i * 3 + 1] = this.beam.y - BEAM_DEPTH * (1 - t);
    }
    this.sparkles.geometry.attributes.position.needsUpdate = true;
    lights.add(this.beam.x, this.beam.y - 2.5, 1.5, 5, SUN, 0.8 + 0.15 * Math.sin(this.time * 2));
    const { minX, maxX, minY } = this.rect;
    const w = maxX - minX;
    for (let i = 0; i < PATCHES; i++) {
      // Slow wandering paths along the seabed, each its own.
      const t = this.time * (0.08 + 0.02 * i) + i * 1.7;
      const x = minX + w * (0.5 + 0.45 * Math.sin(t) * Math.cos(t * 0.37 + i));
      const y = minY + 1.2 + 0.8 * Math.sin(t * 1.9 + i);
      lights.add(x, y, 1.5, 4.5, SUN, 0.45 + 0.15 * Math.sin(this.time * 1.3 + i * 2.1));
    }
  }
}

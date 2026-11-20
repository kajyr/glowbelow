import * as THREE from 'three';
import type { Rect } from '../game/sparkleField';
import type { LocalLights } from './localLights';

const SUN = new THREE.Color('#fff2c8');
const PATCHES = 6;

/**
 * The Sunlit reef's light: the shimmering surface above it (a bright band
 * with a wavy, moving edge), sunlight patterns dancing on a backdrop behind
 * the garden, and soft patches of sun drifting over the seabed (local lights,
 * so the corals and rocks catch them).
 */
export class ReefView {
  readonly group = new THREE.Group();
  private readonly materials: THREE.ShaderMaterial[] = [];
  private time = 0;

  constructor(private readonly rect: Rect) {
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
  }

  update(dt: number, lights: LocalLights): void {
    this.time += dt;
    for (const m of this.materials) m.uniforms.uTime.value = this.time;
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

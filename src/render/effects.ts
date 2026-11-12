import * as THREE from 'three';
import { ringRadius, type Pulse } from '../game/pulse';
import { TUNING } from '../game/tuning';
import type { Rect } from '../game/sparkleField';
import type { LocalLights } from './localLights';

const PULSE_COLOR = new THREE.Color('#7ff0d0');

/** Soft round points (drifting particles and bubbles), drawn additively. */
function pointsMaterial(color: string, size: number, opacity: number, ring = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uSize: { value: size }, uOpacity: { value: opacity }, uScale: { value: 1 } },
    vertexShader: `
      attribute float aSize;
      uniform float uSize;
      uniform float uScale;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * aSize * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        ${ring ? 'float a = smoothstep(1.0, 0.8, d) * (0.35 + 0.65 * smoothstep(0.45, 0.85, d));' : 'float a = smoothstep(1.0, 0.0, d);'}
        gl_FragColor = vec4(uColor, a * uOpacity);
      }`,
  });
}

/**
 * Effects that stay in code: the pulse rings (and the light they leave),
 * drifting particles, rising bubbles and light falling down the shaft.
 */
export class Effects {
  readonly group = new THREE.Group();
  private readonly rings: THREE.Mesh[] = [];
  private readonly ringGeo = new THREE.RingGeometry(0.92, 1, 64);
  private readonly dust: THREE.Points;
  private readonly dustPos: Float32Array;
  private readonly dustVel: Float32Array;
  private readonly bubbles: THREE.Points;
  private readonly bubblePos: Float32Array;
  private readonly bubbleInfo: { vent: number; speed: number; phase: number }[] = [];
  private readonly rays: THREE.Mesh;
  private time = 0;

  constructor(
    private readonly bounds: Rect,
    private readonly vents: number[],
    shaft: { x0: number; x1: number },
  ) {
    // Drifting particles: a box of dust that wraps around the camera.
    const DUST = 260;
    this.dustPos = new Float32Array(DUST * 3);
    this.dustVel = new Float32Array(DUST * 2);
    const dustSize = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      this.dustPos[i * 3] = Math.random() * 30 - 15;
      this.dustPos[i * 3 + 1] = Math.random() * 16 - 8;
      this.dustPos[i * 3 + 2] = Math.random() * 10 - 7;
      this.dustVel[i * 2] = (Math.random() - 0.5) * 0.15;
      this.dustVel[i * 2 + 1] = -0.05 - Math.random() * 0.1;
      dustSize[i] = 0.5 + Math.random();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(this.dustPos, 3));
    dg.setAttribute('aSize', new THREE.BufferAttribute(dustSize, 1));
    this.dust = new THREE.Points(dg, pointsMaterial('#6f8fd0', 60, 0.35));
    this.dust.frustumCulled = false;
    this.group.add(this.dust);

    // Bubbles rising from vents in the seabed.
    const BUBBLES = 40;
    this.bubblePos = new Float32Array(BUBBLES * 3);
    const bubbleSize = new Float32Array(BUBBLES);
    for (let i = 0; i < BUBBLES; i++) {
      this.bubbleInfo.push({ vent: i % vents.length, speed: 0.6 + Math.random() * 0.6, phase: Math.random() * 6 });
      this.bubblePos[i * 3 + 1] = Math.random() * 16;
      bubbleSize[i] = 0.6 + Math.random() * 0.9;
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(this.bubblePos, 3));
    bg.setAttribute('aSize', new THREE.BufferAttribute(bubbleSize, 1));
    this.bubbles = new THREE.Points(bg, pointsMaterial('#a9d6ff', 160, 0.45, true));
    this.bubbles.frustumCulled = false;
    this.group.add(this.bubbles);

    // Light falling down the shaft: the way up is visible.
    const w = shaft.x1 - shaft.x0;
    const rayMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
          float streak = 0.6 + 0.4 * sin(vUv.x * 18.0 + uTime * 0.4) * sin(vUv.x * 7.0 - uTime * 0.25);
          float a = edge * streak * smoothstep(0.0, 1.0, vUv.y) * 0.22;
          gl_FragColor = vec4(vec3(0.45, 0.65, 0.95) * a, a);
        }`,
    });
    this.rays = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.3, 14), rayMat);
    this.rays.position.set((shaft.x0 + shaft.x1) / 2, bounds.maxY - 5, -1.5);
    this.group.add(this.rays);
  }

  /** Draws the rings of active pulses and adds their temporary light. */
  private updateRings(pulses: Pulse[], lights: LocalLights) {
    while (this.rings.length < pulses.length) {
      const m = new THREE.Mesh(
        this.ringGeo,
        new THREE.MeshBasicMaterial({ color: PULSE_COLOR, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
      );
      this.rings.push(m);
      this.group.add(m);
    }
    this.rings.forEach((ring, i) => {
      const p = pulses[i];
      ring.visible = !!p && p.age < p.duration;
      if (!p) return;
      const r = Math.max(0.05, ringRadius(p));
      const t = Math.min(1, p.age / p.duration);
      ring.position.set(p.x, p.y, 0.35);
      ring.scale.setScalar(r);
      const mat = ring.material as THREE.MeshBasicMaterial;
      const strength = p.kind === 'big' ? 1.6 : 1;
      mat.color.copy(PULSE_COLOR).multiplyScalar(strength * 1.8);
      mat.opacity = (1 - t) * 0.9;

      // The area the ring has passed stays lit for a few seconds, then fades.
      const fade = 1 - THREE.MathUtils.smoothstep(p.age, p.duration + TUNING.pulse.lightTime * 0.4, p.duration + TUNING.pulse.lightTime);
      const flash = Math.max(0, 1 - p.age * 3) * 0.8;
      lights.add(p.x, p.y, 1.0, r + 0.5, PULSE_COLOR, (0.55 * strength + flash) * fade, 0.75, true);
    });
  }

  update(dt: number, camera: THREE.Camera, pulses: Pulse[], lights: LocalLights): void {
    this.time += dt;
    this.updateRings(pulses, lights);

    const cx = camera.position.x;
    const cy = camera.position.y;
    const n = this.dustPos.length / 3;
    for (let i = 0; i < n; i++) {
      let x = this.dustPos[i * 3] + this.dustVel[i * 2] * dt + Math.sin(this.time * 0.3 + i) * 0.003;
      let y = this.dustPos[i * 3 + 1] + this.dustVel[i * 2 + 1] * dt;
      // Wrap inside a box around the camera so the dust is always there.
      if (x < cx - 15) x += 30;
      if (x > cx + 15) x -= 30;
      if (y < cy - 8) y += 16;
      if (y > cy + 8) y -= 16;
      this.dustPos[i * 3] = x;
      this.dustPos[i * 3 + 1] = y;
    }
    this.dust.geometry.attributes.position.needsUpdate = true;

    this.bubbleInfo.forEach((b, i) => {
      let y = this.bubblePos[i * 3 + 1] + b.speed * dt;
      if (y > this.bounds.maxY - 3) y = 0.3;
      this.bubblePos[i * 3] = this.vents[b.vent] + Math.sin(this.time * 2 + b.phase) * 0.15 + Math.sin(y * 0.8 + b.phase) * 0.3;
      this.bubblePos[i * 3 + 1] = y;
      this.bubblePos[i * 3 + 2] = -0.8 - (b.phase % 1.5);
    });
    this.bubbles.geometry.attributes.position.needsUpdate = true;

    (this.rays.material as THREE.ShaderMaterial).uniforms.uTime.value = this.time;
  }

  /** Point sizes are in pixels; keep them the same on any screen size. */
  setPixelScale(heightPx: number): void {
    const k = heightPx / 800;
    (this.dust.material as THREE.ShaderMaterial).uniforms.uScale.value = k;
    (this.bubbles.material as THREE.ShaderMaterial).uniforms.uScale.value = k;
  }
}

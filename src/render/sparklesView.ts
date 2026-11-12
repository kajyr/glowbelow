import * as THREE from 'three';
import type { SparkleField } from '../game/sparkleField';
import { modelParts, type Models } from './models';

const FX_MAX = 80;

interface Fx {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

/**
 * Draws every sparkle with one InstancedMesh of sparkle.glb, plus short-lived
 * decorative sparkles (the bump cloud and pickup pops) from the same mesh.
 */
export class SparklesView {
  readonly mesh: THREE.InstancedMesh;
  private readonly fx: Fx[] = [];
  private time = 0;

  constructor(models: Models, private readonly field: SparkleField) {
    const [p] = modelParts(models.sparkle);
    const material = p.material.clone();
    material.emissiveIntensity = 0.5;
    this.mesh = new THREE.InstancedMesh(p.geometry, material, field.sparkles.length + FX_MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
  }

  /** A little cloud of sparkles bursting out (bump reaction). */
  cloud(x: number, y: number, n = 14): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      const s = 1.2 + Math.random() * 1.6;
      this.spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 0.7 + Math.random() * 0.4 });
    }
  }

  /** A tiny pop where a sparkle was eaten. */
  pop(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      this.spawn({ x, y, vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 1.4, life: 0, max: 0.35 });
    }
  }

  private spawn(f: Fx) {
    if (this.fx.length >= FX_MAX) this.fx.shift();
    this.fx.push(f);
  }

  update(dt: number): void {
    this.time += dt;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    let n = 0;
    for (const s of this.field.sparkles) {
      if (!s.alive) continue;
      const twinkle = 1 + 0.18 * Math.sin(this.time * 4 + s.phase * 3);
      e.set(0, Math.sin(this.time * 0.8 + s.phase) * 0.6, this.time * 0.6 + s.phase);
      q.setFromEuler(e);
      pos.set(s.x, s.y, 0.2);
      scl.setScalar(twinkle * (s.pulled ? 0.8 : 1));
      this.mesh.setMatrixAt(n++, m.compose(pos, q, scl));
    }
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life += dt;
      if (f.life >= f.max) {
        this.fx.splice(i, 1);
        continue;
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= 1 - 3 * dt;
      f.vy *= 1 - 3 * dt;
      const k = 1 - f.life / f.max;
      e.set(0, 0, f.life * 6);
      q.setFromEuler(e);
      pos.set(f.x, f.y, 0.4);
      scl.setScalar(0.55 * k);
      this.mesh.setMatrixAt(n++, m.compose(pos, q, scl));
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

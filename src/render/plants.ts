import * as THREE from 'three';
import { placementMatrix } from './instancing';
import { envMaterial, type LocalLights } from './localLights';
import { modelParts, type ModelPart, type Models } from './models';

export type PlantState = 'unlit' | 'blooming' | 'lit';

export interface Plant {
  id: string;
  x: number;
  y: number;
  rot: number;
  scale: number;
  state: PlantState;
  /** Time in the current state. */
  t: number;
  /** Time left in a happy wiggle. */
  wiggle: number;
  /** Time left in the celebration flash. */
  flash: number;
  /** Light it gives, 0 → 1 as it blooms. */
  light: number;
  phase: number;
}

const BLOOM_TIME = 0.9;
const PLANT_LIGHT = new THREE.Color('#7fd8f0');

/**
 * Glow plants: unlit plants show a closed bud; a pulse makes them bloom
 * (bud shrinks, petals grow with a little overshoot) and they then stay lit,
 * swaying and lighting the area around them. Drawn with instancing: one
 * InstancedMesh per model part, matrices updated every frame.
 */
export class PlantsView {
  readonly group = new THREE.Group();
  readonly plants: Plant[];
  private readonly meshes: { part: ModelPart; mesh: THREE.InstancedMesh; pivotInv: THREE.Matrix4; local: THREE.Matrix4 }[] = [];
  private readonly glowMaterial: THREE.MeshStandardMaterial | null = null;
  private time = 0;

  constructor(models: Models, spots: { id: string; x: number; y: number; rot: number; scale: number }[], lights: LocalLights) {
    this.plants = spots.map((s, i) => ({ ...s, state: 'unlit', t: 0, wiggle: 0, flash: 0, light: 0, phase: i * 1.7 }));
    for (const part of modelParts(models['glow-plant'])) {
      let material: THREE.Material;
      if (part.glow) {
        const glow = part.material.clone();
        glow.emissiveIntensity = 2.4;
        this.glowMaterial = glow;
        material = glow;
      } else material = envMaterial(part.material, lights);
      const mesh = new THREE.InstancedMesh(part.geometry, material, this.plants.length);
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const pivotInv = part.pivot.clone().invert();
      this.meshes.push({ part, mesh, pivotInv, local: pivotInv.clone().multiply(part.matrix) });
      this.group.add(mesh);
    }
  }

  get litCount(): number {
    return this.plants.filter((p) => p.state !== 'unlit').length;
  }

  get allLit(): boolean {
    return this.plants.every((p) => p.state !== 'unlit');
  }

  /** A pulse reached this plant. Returns 'bloom' if it starts blooming, 'wiggle' if it was already lit. */
  touch(id: string): 'bloom' | 'wiggle' | null {
    const p = this.plants.find((q) => q.id === id);
    if (!p) return null;
    if (p.state === 'unlit') {
      p.state = 'blooming';
      p.t = 0;
      return 'bloom';
    }
    p.wiggle = 0.6;
    return 'wiggle';
  }

  /** Lights the plant at once (debug and the celebration). */
  lightNow(id: string): void {
    const p = this.plants.find((q) => q.id === id);
    if (p && p.state === 'unlit') {
      p.state = 'blooming';
      p.t = 0;
    }
  }

  /** Starts the celebration flash on a plant, after `delay` seconds. */
  flashAfter(id: string, delay: number): void {
    const p = this.plants.find((q) => q.id === id);
    if (p) p.flash = 1 + delay; // counts down; the visible flash is the last second
  }

  update(dt: number, lights: LocalLights): void {
    this.time += dt;
    const base = new THREE.Matrix4();
    const sway = new THREE.Matrix4();
    const tmp = new THREE.Matrix4();
    const scale = new THREE.Matrix4();
    this.plants.forEach((p, i) => {
      p.t += dt;
      p.wiggle = Math.max(0, p.wiggle - dt);
      p.flash = Math.max(0, p.flash - dt);
      if (p.state === 'blooming' && p.t >= BLOOM_TIME) {
        p.state = 'lit';
        p.t = 0;
      }
      const open = p.state === 'unlit' ? 0 : p.state === 'blooming' ? bloomCurve(p.t / BLOOM_TIME) : 1;
      p.light = p.state === 'unlit' ? 0 : p.state === 'blooming' ? Math.min(1, p.t / BLOOM_TIME) : 1;
      const flash = p.flash > 0 && p.flash < 1 ? Math.sin(p.flash * Math.PI) : 0;

      // Lit plants sway more than sleeping ones; a wiggle shakes them.
      const swayAngle =
        (0.03 + 0.05 * p.light) * Math.sin(this.time * 1.3 + p.phase) + (p.wiggle > 0 ? 0.25 * Math.sin(p.wiggle * 30) * p.wiggle : 0);
      placementMatrix(p.x, p.y, 0.3, p.rot, p.scale, false, base);
      sway.makeRotationZ(swayAngle);
      base.multiply(sway);

      for (const { part, mesh, local } of this.meshes) {
        let k = 1;
        if (part.node === 'bud') k = Math.max(0.0001, 1 - open * 1.2);
        if (part.node === 'petals') k = Math.max(0.0001, open * (1 + 0.25 * flash));
        // base * pivot * scale(k) * pivot⁻¹ * partMatrix
        scale.makeScale(k, k, k);
        tmp.copy(base).multiply(part.pivot).multiply(scale).multiply(local);
        mesh.setMatrixAt(i, tmp);
      }
      if (p.light > 0) lights.add(p.x, p.y + 1, 0.8, 4.2 + flash * 3, PLANT_LIGHT, 0.5 * p.light + flash * 1.2);
    });
    for (const { mesh } of this.meshes) mesh.instanceMatrix.needsUpdate = true;
    if (this.glowMaterial) this.glowMaterial.emissiveIntensity = 2.2 + 0.3 * Math.sin(this.time * 2);
  }
}

/** 0 → 1 with a small overshoot, for the bloom. */
function bloomCurve(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 + 2.2 * (c - 1) ** 3 + 1.2 * (c - 1) ** 2;
}

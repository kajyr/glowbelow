import * as THREE from 'three';
import type { Vec2 } from '../game/vec';
import type { WorldState } from '../game/worldState';
import { lanternId } from '../levels/ids';
import { placementMatrix } from './instancing';
import { envMaterial, type LocalLights } from './localLights';
import { modelParts, type ModelPart, type Models } from './models';

export interface Lantern {
  id: string;
  x: number;
  y: number;
  /** 0 → 1 while lighting up, 1 once lit. */
  light: number;
  lighting: number;
  wiggle: number;
  /** Counts down to the celebration flash; the visible flash is its last second. */
  flash: number;
  phase: number;
}

const LIGHT_TIME = 0.7;
const LANTERN_LIGHT = new THREE.Color('#ffcf8a');

/**
 * The jellyfish lanterns of Twilight: unlit, they are dim pale bells drifting
 * in the blue; a pulse lights them up with a warm glow that stays, bobbing
 * and swaying, and lights the water around them. Lit or not lives in the
 * world state. Drawn with instancing; a lit lantern switches to a warm,
 * glowing copy of its bell so the glow shows from the side-on camera.
 */
export class LanternsView {
  readonly group = new THREE.Group();
  readonly lanterns: Lantern[];
  private readonly meshes: { part: ModelPart; mesh: THREE.InstancedMesh; local: THREE.Matrix4; role: 'bell' | 'lit-bell' | 'glow' | 'tentacles' }[] = [];
  private time = 0;

  constructor(
    models: Models,
    spots: Vec2[],
    lights: LocalLights,
    private readonly world: WorldState,
  ) {
    this.lanterns = spots.map((p, i) => {
      const lit = world.isLit(lanternId(i));
      return { id: lanternId(i), x: p.x, y: p.y, light: lit ? 1 : 0, lighting: 0, wiggle: 0, flash: 0, phase: i * 2.1 };
    });
    const add = (part: ModelPart, material: THREE.Material, role: (typeof this.meshes)[number]['role']) => {
      const mesh = new THREE.InstancedMesh(part.geometry, material, this.lanterns.length);
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.meshes.push({ part, mesh, local: part.pivot.clone().invert().multiply(part.matrix), role });
      this.group.add(mesh);
    };
    const litBell = new THREE.MeshStandardMaterial({
      vertexColors: true,
      emissive: new THREE.Color('#ffc778'),
      emissiveIntensity: 0.55,
      roughness: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    for (const part of modelParts(models['jellyfish-lantern'])) {
      if (part.node === 'bell') {
        add(part, envMaterial(part.material, lights), 'bell');
        add(part, litBell, 'lit-bell');
      } else if (part.node === 'glow') {
        const glow = part.material.clone();
        glow.emissiveIntensity = 2;
        add(part, glow, 'glow');
      } else add(part, envMaterial(part.material, lights), 'tentacles');
    }
  }

  get litCount(): number {
    return this.world.litCount(this.lanterns.map((l) => l.id));
  }

  get allLit(): boolean {
    return this.litCount === this.lanterns.length;
  }

  /** A pulse reached this lantern: lights it (true), or a happy wiggle if it was lit (false). */
  touch(id: string): boolean | null {
    const l = this.lanterns.find((q) => q.id === id);
    if (!l) return null;
    if (this.world.light(id)) {
      l.lighting = LIGHT_TIME;
      return true;
    }
    l.wiggle = 0.6;
    return false;
  }

  /** Starts the celebration flash on a lantern, after `delay` seconds. */
  flashAfter(id: string, delay: number): void {
    const l = this.lanterns.find((q) => q.id === id);
    if (l) l.flash = 1 + delay;
  }

  update(dt: number, lights: LocalLights): void {
    this.time += dt;
    const base = new THREE.Matrix4();
    const tmp = new THREE.Matrix4();
    const scale = new THREE.Matrix4();
    const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    const sway = new THREE.Matrix4();
    this.lanterns.forEach((l, i) => {
      const lit = this.world.isLit(l.id);
      l.lighting = Math.max(0, l.lighting - dt);
      l.wiggle = Math.max(0, l.wiggle - dt);
      l.flash = Math.max(0, l.flash - dt);
      l.light = lit ? (l.lighting > 0 ? 1 - l.lighting / LIGHT_TIME : 1) : 0;
      const pop = l.lighting > 0 ? Math.sin((1 - l.lighting / LIGHT_TIME) * Math.PI) * 0.25 : 0;
      const flash = l.flash > 0 && l.flash < 1 ? Math.sin(l.flash * Math.PI) : 0;
      // Lit lanterns bob more; unlit ones drift a little.
      const bob = (0.08 + 0.18 * l.light) * Math.sin(this.time * 1.1 + l.phase);
      const wig = l.wiggle > 0 ? 0.3 * Math.sin(l.wiggle * 28) * l.wiggle : 0;
      placementMatrix(l.x, l.y + bob, 0.2, wig, 1 + pop + 0.15 * flash, false, base);
      for (const { part, mesh, local, role } of this.meshes) {
        let k = 1;
        if (role === 'bell' && lit) k = 0;
        if (role === 'lit-bell' && !lit) k = 0;
        if (role === 'glow') k = l.light * (1 + 0.2 * flash);
        if (k === 0) {
          mesh.setMatrixAt(i, hidden);
          continue;
        }
        scale.makeScale(k, k, k);
        tmp.copy(base).multiply(part.pivot);
        if (role === 'tentacles') tmp.multiply(sway.makeRotationZ(0.15 * Math.sin(this.time * 1.6 + l.phase)));
        tmp.multiply(scale).multiply(local);
        mesh.setMatrixAt(i, tmp);
      }
      if (l.light > 0) lights.add(l.x, l.y + 0.3, 0.8, 4.5 + flash * 3, LANTERN_LIGHT, 0.55 * l.light + flash * 1.2);
    });
    for (const { mesh } of this.meshes) mesh.instanceMatrix.needsUpdate = true;
  }
}

export { lanternId };

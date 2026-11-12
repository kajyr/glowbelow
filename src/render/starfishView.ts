import * as THREE from 'three';
import type { StarfishSpot } from '../levels/starfish';
import type { WorldState } from '../game/worldState';
import { envMaterial, type LocalLights } from './localLights';
import { modelParts, type ModelPart, type Models } from './models';

const STAR_LIGHT = new THREE.Color('#ffd58f');
const WAVE_TIME = 1.4;

interface Star {
  id: string;
  x: number;
  y: number;
  rot: number;
  zone: string;
  /** Counts down while waving. */
  wave: number;
  /** Counts down to the zone-complete flash; the visible flash is its last second. */
  flash: number;
  phase: number;
}

/**
 * The starfish: dim and still until found, then full colour with glowing
 * tips and a little light of their own, waving an arm. Found or not lives in
 * the world state. Drawn with instancing: each part has a dim and a lit copy,
 * and each starfish shows one of them.
 */
export class StarfishView {
  readonly group = new THREE.Group();
  readonly stars: Star[];
  private readonly meshes: { part: ModelPart; mesh: THREE.InstancedMesh; local: THREE.Matrix4; lit: boolean }[] = [];
  private time = 0;

  constructor(
    models: Models,
    spots: StarfishSpot[],
    ids: string[],
    lights: LocalLights,
    private readonly world: WorldState,
  ) {
    this.stars = spots.map((s, i) => ({ id: ids[i], x: s.x, y: s.y, rot: s.rot, zone: s.zone, wave: 0, flash: 0, phase: i * 1.9 }));
    for (const part of modelParts(models.starfish)) {
      // Dim: darker and flat, tucked away. Lit: full colour; glowing tips shine.
      const dim = envMaterial(part.material, lights);
      dim.color = new THREE.Color(0.42, 0.42, 0.5);
      dim.emissiveIntensity = part.glow ? 0.12 : 0;
      const lit = part.glow ? part.material.clone() : envMaterial(part.material, lights);
      if (part.glow) lit.emissiveIntensity = 1.8;
      for (const [material, isLit] of [[dim, false], [lit, true]] as const) {
        const mesh = new THREE.InstancedMesh(part.geometry, material, Math.max(1, this.stars.length));
        mesh.frustumCulled = false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.meshes.push({ part, mesh, local: part.pivot.clone().invert().multiply(part.matrix), lit: isLit });
        this.group.add(mesh);
      }
    }
  }

  /** Ids of the starfish in a zone. */
  idsIn(zone: string): string[] {
    return this.stars.filter((s) => s.zone === zone).map((s) => s.id);
  }

  /** A pulse reached it: it waves (found or not; finding is the world state's job). */
  wave(id: string): void {
    const s = this.stars.find((q) => q.id === id);
    if (s) s.wave = WAVE_TIME;
  }

  /** Starts the zone-complete flash on a starfish after `delay` seconds. */
  flashAfter(id: string, delay: number): void {
    const s = this.stars.find((q) => q.id === id);
    if (s) s.flash = 1 + delay;
  }

  update(dt: number, lights: LocalLights): void {
    this.time += dt;
    const base = new THREE.Matrix4();
    const tmp = new THREE.Matrix4();
    const turn = new THREE.Matrix4();
    const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    const q = new THREE.Quaternion();
    const z = new THREE.Vector3(0, 0, 1);
    this.stars.forEach((s, i) => {
      const found = this.world.hasFoundStarfish(s.id);
      s.wave = Math.max(0, s.wave - dt);
      s.flash = Math.max(0, s.flash - dt);
      const flash = s.flash > 0 && s.flash < 1 ? Math.sin(s.flash * Math.PI) : 0;
      // Found starfish breathe a little; the wave is a happy hop plus one arm waving.
      const hop = s.wave > 0 ? Math.sin((1 - s.wave / WAVE_TIME) * Math.PI) * 0.12 : 0;
      const breathe = found ? 1 + 0.03 * Math.sin(this.time * 1.5 + s.phase) : 1;
      q.setFromAxisAngle(z, s.rot);
      base.compose(new THREE.Vector3(s.x, s.y + hop, -0.15), q, new THREE.Vector3(breathe * (1 + 0.12 * flash), breathe * (1 + 0.12 * flash), 1));
      for (const { part, mesh, local, lit } of this.meshes) {
        if (lit !== found) {
          mesh.setMatrixAt(i, hidden);
          continue;
        }
        tmp.copy(base).multiply(part.pivot);
        if (part.node.startsWith('arm-')) {
          const k = Number(part.node.slice(4));
          // Arm 1 waves big; the others wiggle along.
          const w = s.wave > 0 ? Math.sin((1 - s.wave / WAVE_TIME) * Math.PI * 4) * (k === 1 ? 0.5 : 0.12) : 0;
          tmp.multiply(turn.makeRotationZ(w));
        }
        tmp.multiply(local);
        mesh.setMatrixAt(i, tmp);
      }
      if (found) lights.add(s.x, s.y, 0.6, 2 + flash * 2, STAR_LIGHT, 0.3 + flash);
    });
    for (const { mesh } of this.meshes) mesh.instanceMatrix.needsUpdate = true;
  }
}

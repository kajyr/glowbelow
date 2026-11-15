import * as THREE from 'three';
import type { WorldState } from '../game/worldState';
import { TUNING } from '../game/tuning';
import type { SkeletonPlacement } from '../levels/level';
import { envMaterial, type LocalLights } from './localLights';
import type { Models } from './models';

const RIB_LIGHT = new THREE.Color('#8fc8f0');
const GLOW = new THREE.Color('#7fb8e8');
const LIGHT_TIME = 0.6;

interface Rib {
  id: string;
  node: THREE.Mesh;
  /** World point at the middle of the rib, for its light. */
  at: THREE.Vector3;
  env: THREE.Material;
  lit: THREE.MeshStandardMaterial;
  /** 0 → 1 while lighting up. */
  light: number;
  /** 1 right after its note, ringing down to 0. */
  ring: number;
}

/**
 * The whale skeleton on screen: pale bone that pulses light up like the
 * rocks. A rib reached by a glow rings like a xylophone bar and stays softly
 * lit, lighting the water around it. The whale song makes the whole skeleton
 * glow for a few seconds. Lit or not lives in the world state.
 */
export class SkeletonView {
  readonly root = new THREE.Group();
  readonly ribs: Rib[];
  private readonly bones: THREE.Mesh[] = [];
  private readonly boneEnv: THREE.Material;
  private readonly boneGlow: THREE.MeshStandardMaterial;
  private song = 0;
  private time = 0;
  private readonly centre: THREE.Vector3;

  constructor(models: Models, s: SkeletonPlacement, ribIds: string[], ribPoints: { x: number; y: number }[], lights: LocalLights, private readonly world: WorldState) {
    const model = models['whale-skeleton'].clone(true);
    this.root.add(model);
    this.root.position.set(s.x, s.y, 0);
    if (s.mirror) this.root.scale.x = -1;
    let base: THREE.MeshStandardMaterial | null = null;
    const ribNodes = new Map<string, THREE.Mesh>();
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      base ??= mesh.material as THREE.MeshStandardMaterial;
      if (mesh.name.startsWith('rib-')) ribNodes.set(mesh.name, mesh);
      else this.bones.push(mesh);
    });
    if (!base) throw new Error('whale skeleton has no meshes');
    const glowOf = (m: THREE.MeshStandardMaterial) => {
      const g = m.clone();
      // A soft blue bone, so a lit rib reads as glowing rather than white.
      g.color = new THREE.Color('#bcd9f2');
      g.emissive = GLOW.clone();
      g.emissiveIntensity = 0;
      return g;
    };
    this.boneEnv = envMaterial(base, lights);
    this.boneGlow = glowOf(base);
    for (const b of this.bones) b.material = this.boneEnv;
    this.ribs = ribIds.map((id, i) => {
      const node = ribNodes.get(`rib-${i}`);
      if (!node) throw new Error(`whale skeleton has no rib-${i}`);
      const lit = glowOf(base!);
      const r: Rib = { id, node, at: new THREE.Vector3(ribPoints[i].x, ribPoints[i].y, 0.6), env: this.boneEnv, lit, light: world.isLit(id) ? 1 : 0, ring: 0 };
      node.material = r.light > 0 ? lit : this.boneEnv;
      return r;
    });
    const xs = ribPoints.map((p) => p.x);
    this.centre = new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, ribPoints[0].y, 1.5);
  }

  get litCount(): number {
    return this.world.litCount(this.ribs.map((r) => r.id));
  }

  get allLit(): boolean {
    return this.litCount === this.ribs.length;
  }

  /** A rib was reached: it rings, and lights up if it was dark. Returns true when it was dark. */
  touch(id: string): boolean {
    const r = this.ribs.find((q) => q.id === id);
    if (!r) return false;
    r.ring = 1;
    return this.world.light(id);
  }

  /** The whale song: every bone glows for a while. */
  sing(): void {
    this.song = TUNING.whaleFall.songGlow;
    for (const r of this.ribs) r.ring = 1;
  }

  update(dt: number, lights: LocalLights): void {
    this.time += dt;
    this.song = Math.max(0, this.song - dt);
    const songGlow = Math.min(1, this.song, (TUNING.whaleFall.songGlow - this.song) * 2);
    for (const [i, r] of this.ribs.entries()) {
      const isLit = this.world.isLit(r.id);
      r.light = isLit ? Math.min(1, r.light + dt / LIGHT_TIME) : 0;
      r.ring = Math.max(0, r.ring - dt * 1.4);
      r.node.material = r.light > 0 ? r.lit : r.env;
      r.lit.emissiveIntensity = 0.12 * r.light + 0.02 * Math.sin(this.time * 1.3 + i) + 0.22 * songGlow + 0.25 * r.ring;
      // A xylophone bar after its note: a quick little swing about the spine.
      r.node.rotation.z = 0.06 * r.ring * Math.sin(this.time * 22);
      if (r.light > 0) lights.add(r.at.x, r.at.y, r.at.z, 3 + songGlow, RIB_LIGHT, 0.18 * r.light + 0.25 * r.ring + 0.15 * songGlow);
    }
    for (const b of this.bones) b.material = songGlow > 0 ? this.boneGlow : this.boneEnv;
    this.boneGlow.emissiveIntensity = 0.2 * songGlow;
    if (songGlow > 0) lights.add(this.centre.x, this.centre.y, this.centre.z, 16, RIB_LIGHT, 0.3 * songGlow);
  }
}

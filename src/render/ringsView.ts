import * as THREE from 'three';
import type { BubbleRings } from '../game/bubbleRings';
import { TUNING } from '../game/tuning';
import { modelParts, type ModelPart, type Models } from './models';

/** How long the pop (bubbles flying apart) lasts, and how long the regrowth takes at the end. */
const POP = 0.35;
const GROW = 0.9;

/**
 * Draws the bubble rings with instancing, one mesh per bubble part: they sway
 * gently; a pop sends every bubble out a little and shrinks it away, and near
 * the end of the regrow time the bubbles swell back one after another.
 */
export class RingsView {
  readonly group = new THREE.Group();
  private readonly meshes: { part: ModelPart; mesh: THREE.InstancedMesh; local: THREE.Matrix4; index: number; dir: THREE.Vector3 }[] = [];
  private readonly spots: { chain: number; ring: number; x: number; y: number; phase: number }[] = [];
  private time = 0;

  constructor(
    models: Models,
    private readonly rings: BubbleRings,
  ) {
    rings.chains.forEach((c, ci) => c.rings.forEach((p, ri) => this.spots.push({ chain: ci, ring: ri, x: p.x, y: p.y, phase: ci * 3.1 + ri * 0.9 })));
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.75, roughness: 0.3, emissive: new THREE.Color('#9fdcf5'), emissiveIntensity: 0.35 });
    for (const part of modelParts(models['bubble-ring'])) {
      const mesh = new THREE.InstancedMesh(part.geometry, material, this.spots.length);
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const index = Number(part.node.split('-')[1]);
      // Which way this bubble flies when the ring pops: out from the middle.
      const centre = new THREE.Vector3().setFromMatrixPosition(part.pivot);
      this.meshes.push({ part, mesh, local: part.pivot.clone().invert().multiply(part.matrix), index, dir: centre.normalize() });
      this.group.add(mesh);
    }
  }

  update(dt: number): void {
    this.time += dt;
    const R = TUNING.rings;
    const base = new THREE.Matrix4();
    const tmp = new THREE.Matrix4();
    const scale = new THREE.Matrix4();
    const move = new THREE.Matrix4();
    this.spots.forEach((s, i) => {
      const w = this.rings.whole(s.chain, s.ring);
      // Seconds since it popped (regrow when whole).
      const since = w >= 1 ? R.regrow : w * R.regrow;
      const sway = 0.12 * Math.sin(this.time * 0.8 + s.phase);
      base.makeRotationZ(0.06 * Math.sin(this.time * 0.6 + s.phase)).setPosition(s.x, s.y + sway, 0);
      for (const { part, mesh, local, index, dir } of this.meshes) {
        let k = 1;
        let out = 0;
        if (since < POP) {
          // Popping: out and away.
          const t = since / POP;
          k = 1 - t;
          out = 0.6 * t;
        } else if (since < R.regrow) {
          // Gone, then swelling back one bubble after another.
          const grow = (since - (R.regrow - GROW)) / GROW - (index / 12) * 0.5;
          k = Math.min(1, Math.max(0, grow * 2));
        }
        k *= 1 + 0.06 * Math.sin(this.time * 2.2 + index + s.phase);
        tmp.copy(base).multiply(move.makeTranslation(dir.x * out, dir.y * out, dir.z * out)).multiply(part.pivot);
        tmp.multiply(scale.makeScale(k, k, k)).multiply(local);
        mesh.setMatrixAt(i, tmp);
      }
    });
    for (const { mesh } of this.meshes) mesh.instanceMatrix.needsUpdate = true;
  }
}

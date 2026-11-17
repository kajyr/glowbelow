import * as THREE from 'three';
import type { Vec2 } from '../game/vec';
import { modelParts, type Models } from './models';

const PER_SCHOOL = 9;

/**
 * Small schools of tiny fish drifting in loose loops around their spots:
 * set dressing that makes a zone feel alive. Decoration only, a little behind
 * the play plane; drawn with instancing.
 */
export class FishView {
  readonly group = new THREE.Group();
  private readonly meshes: { mesh: THREE.InstancedMesh; local: THREE.Matrix4 }[] = [];
  private readonly fish: { school: Vec2; dx: number; dy: number; phase: number; speed: number; rx: number; ry: number }[] = [];
  private time = 0;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly e = new THREE.Euler();
  private readonly p = new THREE.Vector3();
  private readonly s = new THREE.Vector3();

  constructor(models: Models, schools: Vec2[]) {
    schools.forEach((school, k) => {
      for (let i = 0; i < PER_SCHOOL; i++) {
        const a = (i / PER_SCHOOL) * Math.PI * 2;
        this.fish.push({ school, dx: Math.cos(a * 2.3) * 0.9, dy: Math.sin(a * 1.7) * 0.6, phase: k * 2.1, speed: 0.22 + 0.02 * (k % 3), rx: 4 + k, ry: 1.6 });
      }
    });
    for (const part of modelParts(models['small-fish'])) {
      const mesh = new THREE.InstancedMesh(part.geometry, part.material, Math.max(1, this.fish.length));
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.meshes.push({ mesh, local: part.matrix.clone() });
      this.group.add(mesh);
    }
  }

  update(dt: number): void {
    this.time += dt;
    for (const [i, f] of this.fish.entries()) {
      // The school swims a slow loop; each fish wiggles around its place in it.
      const a = this.time * f.speed + f.phase;
      const x = f.school.x + Math.cos(a) * f.rx + f.dx + 0.15 * Math.sin(this.time * 2 + i);
      const y = f.school.y + Math.sin(a * 2) * f.ry * 0.5 + f.dy + 0.1 * Math.cos(this.time * 1.7 + i);
      const vx = -Math.sin(a) * f.rx;
      const vy = Math.cos(a * 2) * f.ry;
      const facing = vx >= 0 ? 1 : -1;
      this.p.set(x, y, -0.9 - (i % 3) * 0.3);
      this.e.set(0, 0, Math.atan2(vy * 0.3, Math.abs(vx)) * facing + 0.1 * Math.sin(this.time * 6 + i));
      this.q.setFromEuler(this.e);
      this.s.set(facing, 1, 1);
      this.m.compose(this.p, this.q, this.s);
      for (const { mesh, local } of this.meshes) mesh.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(this.m, local));
    }
    for (const { mesh } of this.meshes) mesh.instanceMatrix.needsUpdate = true;
  }
}

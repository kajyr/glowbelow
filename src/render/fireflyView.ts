import * as THREE from 'three';
import type { Swarm } from '../game/swarm';
import { envMaterial, type LocalLights } from './localLights';
import { modelParts, type ModelPart, type Models } from './models';

/** The model is built large; in the game a firefly is about a quarter of the squid. */
const SCALE = 0.13;
const FIREFLY_LIGHT = new THREE.Color('#9fe1cb');

/**
 * Draws the firefly squid with instancing, one mesh per model part: they
 * twinkle (their glow tips pulse), flap their fins and wiggle their arms,
 * and tip their mantle the way they swim. Smaller and dimmer than the squid,
 * so the swarm never hides it. Each group, and the swarm, adds one soft light.
 */
export class FireflyView {
  readonly group = new THREE.Group();
  private readonly meshes: { part: ModelPart; mesh: THREE.InstancedMesh; local: THREE.Matrix4 }[] = [];
  private readonly tilt: number[];
  private time = 0;

  constructor(
    models: Models,
    private readonly swarm: Swarm,
    lights: LocalLights,
  ) {
    const n = swarm.fireflies.length;
    this.tilt = new Array(n).fill(0);
    for (const part of modelParts(models['firefly-squid'])) {
      let material: THREE.Material;
      if (part.glow) {
        const glow = part.material.clone();
        glow.emissiveIntensity = 1.6;
        material = glow;
      } else material = envMaterial(part.material, lights);
      const mesh = new THREE.InstancedMesh(part.geometry, material, n);
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.meshes.push({ part, mesh, local: part.pivot.clone().invert().multiply(part.matrix) });
      this.group.add(mesh);
    }
  }

  update(dt: number, lights: LocalLights): void {
    this.time += dt;
    const base = new THREE.Matrix4();
    const tmp = new THREE.Matrix4();
    const anim = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const zAxis = new THREE.Vector3(0, 0, 1);
    this.swarm.fireflies.forEach((f, i) => {
      // Mantle first along the way it swims; upright with a gentle sway when slow.
      const speed = Math.hypot(f.vel.x, f.vel.y);
      const want = speed > 0.8 ? Math.atan2(f.vel.y, f.vel.x) - Math.PI / 2 : 0.25 * Math.sin(this.time * 1.3 + f.phase);
      let d = want - this.tilt[i];
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.tilt[i] += d * Math.min(1, dt * 6);
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * 5 + f.phase * 3);
      q.setFromAxisAngle(zAxis, this.tilt[i]);
      base.compose(new THREE.Vector3(f.pos.x, f.pos.y, 0.3), q, new THREE.Vector3(SCALE, SCALE, SCALE));
      for (const { part, mesh, local } of this.meshes) {
        tmp.copy(base).multiply(part.pivot);
        if (part.node === 'fins') {
          const flap = 1 + 0.35 * Math.sin(this.time * 9 + f.phase);
          tmp.multiply(anim.makeScale(flap, 1, 1));
        } else if (part.node === 'arms') {
          tmp.multiply(anim.makeRotationX(0.25 * Math.sin(this.time * 4 + f.phase)));
        }
        if (part.glow) tmp.multiply(anim.makeScale(0.75 + 0.5 * twinkle, 0.75 + 0.5 * twinkle, 0.75 + 0.5 * twinkle));
        tmp.multiply(local);
        mesh.setMatrixAt(i, tmp);
      }
    });
    for (const { mesh } of this.meshes) mesh.instanceMatrix.needsUpdate = true;

    // One soft light per group still at home, and one for the swarm.
    this.swarm.groups.forEach((g, gi) => {
      if (!this.swarm.hasJoined(gi)) lights.add(g.x, g.y, 0.8, 2.6, FIREFLY_LIGHT, 0.35);
    });
    if (this.swarm.joined.length > 0) {
      const c = this.swarm.centre.pos;
      lights.add(c.x, c.y, 0.8, 2.4 + 0.3 * this.swarm.joined.length, FIREFLY_LIGHT, 0.3 + 0.06 * this.swarm.joined.length);
    }
  }
}

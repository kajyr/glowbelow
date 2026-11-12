import * as THREE from 'three';
import type { Jelly } from '../game/jelly';
import { TUNING } from '../game/tuning';
import { envMaterial, type LocalLights } from './localLights';
import { part, type Models } from './models';

/**
 * The phantom jelly on screen: the bell pulses slowly, the four ribbon arms
 * sway out of step, and the rim brightens for a moment when touched. Its
 * body uses the environment material, so it stays as dark as the deep sea
 * and shows up where pulses, plants or the squid's glow light it; only the
 * rim glows on its own.
 */
export class JellyView {
  readonly root = new THREE.Group();
  private readonly bell: THREE.Object3D;
  private readonly arms: THREE.Object3D[];
  private readonly rim: THREE.MeshStandardMaterial;
  private time = 0;
  private flashT = 0;

  constructor(models: Models, lights: LocalLights) {
    const model = models['phantom-jelly'].clone(true);
    model.scale.setScalar(TUNING.jelly.scale);
    this.root.add(model);
    this.root.name = 'phantom-jelly';
    this.bell = part(model, 'bell');
    this.arms = [1, 2, 3, 4].map((i) => part(model, `arm-${i}`));
    let rim: THREE.MeshStandardMaterial | null = null;
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m.name === 'Glow') {
        rim ??= m.clone();
        mesh.material = rim;
      } else {
        // Front faces only: the ribbon arms have a front and a back face in
        // the same plane, which flicker against each other if both are drawn.
        const env = envMaterial(m, lights);
        env.side = THREE.FrontSide;
        // A little see-through, like a real jelly.
        env.transparent = true;
        env.opacity = 0.72;
        env.depthWrite = false;
        mesh.material = env;
      }
    });
    this.rim = rim!;
  }

  /** Brief brightening of the rim when the squid touches it. */
  flash(): void {
    this.flashT = 1;
  }

  update(dt: number, jelly: Jelly): void {
    this.time += dt;
    this.flashT = Math.max(0, this.flashT - dt * 1.5);
    // Slow swim pulse: the bell squeezes in and the jelly lifts a little.
    const beat = Math.sin(this.time * 1.3);
    this.bell.scale.set(1 + 0.06 * beat, 1 - 0.08 * beat, 1 + 0.06 * beat);
    this.arms.forEach((arm, i) => {
      arm.rotation.z = 0.12 * Math.sin(this.time * 0.8 + i * 1.7);
      arm.rotation.x = 0.08 * Math.sin(this.time * 0.6 + i * 2.3);
    });
    this.root.position.set(jelly.pos.x, jelly.pos.y + 0.06 * beat, -0.2);
    this.rim.emissiveIntensity = 0.7 + 0.25 * Math.max(0, beat) + 2 * this.flashT;
  }
}

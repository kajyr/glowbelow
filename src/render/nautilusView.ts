import * as THREE from 'three';
import type { Nautilus } from '../game/nautilus';
import { TUNING } from '../game/tuning';
import { part, type Models } from './models';

/**
 * The nautilus on screen: the model in profile, tipping its head toward where
 * it cruises (up or down), flipped to look left or right, bobbing gently with
 * its tentacles swaying. Drawn a little behind the play plane, so the squid
 * always passes in front of it.
 */
export class NautilusView {
  readonly root = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly tentacles: THREE.Object3D;
  private readonly head: THREE.Object3D;
  private time = 0;
  private tilt = 0;
  private flip = 1;
  private nod = 0;

  constructor(models: Models) {
    const model = models.nautilus.clone(true);
    model.scale.setScalar(TUNING.nautilus.scale);
    this.body.add(model);
    this.root.add(this.body);
    this.tentacles = part(model, 'tentacles');
    this.head = part(model, 'head');
  }

  /** A small nod of the head (it answers a call, or meets the squid). */
  nodHead(): void {
    this.nod = 1;
  }

  update(dt: number, n: Nautilus): void {
    this.time += dt;
    this.nod = Math.max(0, this.nod - dt * 1.5);
    const moving = n.state === 'cruise' || n.state === 'called';
    // Head up when rising, down when sinking, level when stopped.
    const wantTilt = moving ? n.heading * 0.55 : 0;
    this.tilt += (wantTilt - this.tilt) * Math.min(1, dt * 2);
    this.flip += (n.facing - this.flip) * Math.min(1, dt * 3);
    const bob = 0.12 * Math.sin(this.time * 0.9);
    this.root.position.set(n.pos.x, n.pos.y + bob, -0.6);
    this.body.scale.set(this.flip, 1, 1);
    this.body.rotation.z = this.tilt * Math.sign(this.flip || 1);
    this.tentacles.rotation.z = 0.12 * Math.sin(this.time * 1.7) + (moving ? 0 : 0.05);
    this.head.rotation.z = -0.25 * Math.sin(this.nod * Math.PI);
  }
}

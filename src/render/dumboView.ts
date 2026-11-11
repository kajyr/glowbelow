import * as THREE from 'three';
import type { DumboBrain } from '../game/dumboBrain';
import { POP_TIME } from '../game/dumboBrain';
import type { Vec2 } from '../game/vec';
import { part, type Models } from './models';

const DUMBO_SCALE = 0.3;

/**
 * Dumbo on screen: two blinking eyes in the cave before it is found; then
 * the model, popping out with a happy spin, flapping its ears, pulsing its
 * skirt, bouncing on pulses and wiggling an ear toward a plant it points at.
 */
export class DumboView {
  readonly root = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly model: THREE.Group;
  private readonly ears: [THREE.Object3D, THREE.Object3D];
  private readonly skirt: THREE.Object3D[];
  private readonly eyes: THREE.Object3D[];
  readonly caveEyes = new THREE.Group();
  private time = 0;
  private blinkIn = 1.5;
  private blinkT = 0;
  private bounce = 0;
  private spin = 0;
  private yaw = 0;

  constructor(models: Models, eyesAt: Vec2) {
    this.model = models['dumbo-octopus'].clone(true);
    this.model.scale.setScalar(DUMBO_SCALE);
    this.root.add(this.body);
    this.body.add(this.model);
    this.root.visible = false;
    this.ears = [part(this.model, 'ear-l'), part(this.model, 'ear-r')];
    this.skirt = ['skirt', 'arms'].map((n) => part(this.model, n));
    this.eyes = [part(this.model, 'eye-l'), part(this.model, 'eye-r')];

    // Eyes in the dark: two pale ovals with pupils.
    const white = new THREE.MeshBasicMaterial({ color: '#d7e8ff' });
    const pupil = new THREE.MeshBasicMaterial({ color: '#06122a' });
    const eye = new THREE.SphereGeometry(0.13, 12, 8);
    const dot = new THREE.SphereGeometry(0.07, 10, 6);
    for (const side of [-1, 1]) {
      const e = new THREE.Mesh(eye, white);
      e.scale.set(1, 1.25, 0.5);
      e.position.set(side * 0.2, 0, 0);
      const p = new THREE.Mesh(dot, pupil);
      p.position.set(side * 0.2 - 0.03, -0.02, 0.07);
      this.caveEyes.add(e, p);
    }
    this.caveEyes.position.set(eyesAt.x, eyesAt.y, -0.6);
  }

  /** Small hop when the squid glows. */
  hop(): void {
    this.bounce = 1;
  }

  /** Happy spin (found, or every plant lit). */
  happySpin(): void {
    this.spin = 1;
  }

  update(dt: number, brain: DumboBrain): void {
    this.time += dt;

    // Cave eyes blink every few seconds until dumbo is found.
    this.caveEyes.visible = brain.state === 'hidden';
    if (this.caveEyes.visible) {
      this.blinkIn -= dt;
      if (this.blinkIn <= 0) {
        this.blinkT = 0.16;
        this.blinkIn = 2 + Math.random() * 2.5;
      }
      this.blinkT = Math.max(0, this.blinkT - dt);
      this.caveEyes.scale.y = this.blinkT > 0 ? 0.1 : 1;
      this.caveEyes.position.x += Math.sin(this.time * 0.7) * 0.002;
    }
    if (brain.state === 'hidden') return;
    this.root.visible = true;

    let grow = 1;
    if (brain.state === 'popping') {
      const t = brain.popTime / POP_TIME;
      grow = Math.min(1, t * 3); // pops out quickly
      if (t < 0.05) this.spin = 1;
    }
    this.spin = Math.max(0, this.spin - dt / 0.9);
    this.bounce = Math.max(0, this.bounce - dt / 0.5);

    // Face where it swims (or the plant it points at); face the camera when slow.
    const speed = Math.hypot(brain.vel.x, brain.vel.y);
    const pointing = brain.pointing !== null;
    const yawTarget = speed > 1 || pointing ? brain.facing * 1.0 : 0;
    this.yaw += (yawTarget - this.yaw) * (1 - Math.exp(-5 * dt));
    this.body.rotation.y = this.yaw + (1 - (1 - this.spin) ** 2) * Math.PI * 2 * (this.spin > 0 ? 1 : 0);
    this.body.rotation.z = -brain.vel.x * 0.04;

    const hop = Math.sin(this.bounce * Math.PI) * 0.35;
    const bob = Math.sin(this.time * 2.1) * 0.08;
    this.root.position.set(brain.pos.x, brain.pos.y + bob + hop, -0.4);
    this.root.scale.setScalar(grow);

    // Ears flap; one wiggles fast when pointing.
    const flap = Math.sin(this.time * 5) * 0.3;
    const wiggle = pointing ? Math.sin(this.time * 22) * 0.45 : flap;
    this.ears[0].rotation.z = brain.facing > 0 ? flap : wiggle;
    this.ears[1].rotation.z = brain.facing > 0 ? -wiggle : -flap;

    // Skirt pulses like a little umbrella.
    const pulse = Math.max(0, Math.sin(this.time * 3.2)) * 0.18;
    for (const s of this.skirt) s.scale.set(1 + pulse * 0.5, 1 - pulse, 1 + pulse * 0.5);

    const blink = (this.time % 3.7) < 0.13 ? 0.12 : 1;
    for (const e of this.eyes) e.scale.y = blink;
  }
}

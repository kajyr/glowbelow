import * as THREE from 'three';
import type { GiantSquid } from '../game/giantSquid';
import { TUNING } from '../game/tuning';
import type { Vec2 } from '../game/vec';
import type { LocalLights } from './localLights';
import { part, type Models } from './models';

const ARM_LIGHT = new THREE.Color('#ffd2b8');

/**
 * The giant squid on screen. Asleep it lies low behind the whale skull,
 * breathing slowly with its eye closed, and shuffles when a small glow
 * reaches it. Awake it hovers a little behind the play plane, swaying, its
 * arms waving, its eye following the squid, and holds its lower tentacle
 * down toward the arm's tip, which glows softly to invite a touch. While
 * carrying it leans into the way it swims. It turns round like a solid
 * thing, head swinging away from the camera, never flattening to a sheet.
 */
export class GiantSquidView {
  readonly root = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly arms: THREE.Object3D;
  private readonly tentacle: THREE.Object3D;
  private readonly tentacleFar: THREE.Object3D;
  private readonly eyes: THREE.Object3D[];
  private time = 0;
  private flip = 1;
  private tilt = 0;

  constructor(models: Models) {
    const model = models['giant-squid'].clone(true);
    model.scale.setScalar(TUNING.giant.scale);
    this.body.add(model);
    this.root.add(this.body);
    this.arms = part(model, 'arms');
    this.tentacle = part(model, 'tentacle');
    this.tentacleFar = part(model, 'tentacle-far');
    this.eyes = [part(model, 'eye'), part(model, 'eye-far')];
  }

  update(dt: number, g: GiantSquid, squid: Vec2, lights: LocalLights): void {
    this.time += dt;
    const t = this.time;
    const awake = g.awake;
    this.flip += (g.facing - this.flip) * Math.min(1, dt * 2.5);
    // Turning: a yaw from 0 (facing right) to π (facing left) through π/2, head away from
    // the camera, so the shorter tail end swings forward; it drifts back mid-turn to stay
    // behind the play plane.
    const yaw = (Math.PI * (1 - this.flip)) / 2;
    const turning = Math.sin(yaw);
    // Asleep: lying low and far back behind the skull. Awake: a little behind the play plane.
    const z = -2.6 + 1.4 * awake - TUNING.giant.turnDepth * turning;
    const breathe = 1 + 0.03 * Math.sin(t * (awake > 0 ? 1.1 : 0.6));
    const shuffle = g.stir * Math.sin(t * 9) * 0.12;
    const bob = awake * 0.25 * Math.sin(t * 0.7);
    this.root.position.set(g.pos.x, g.pos.y + bob, z);
    this.body.scale.setScalar(breathe);
    this.body.rotation.y = yaw;
    // Leaning into a climb or a dive while carrying; level otherwise.
    const wantTilt = g.state === 'carrying' || g.state === 'returning' ? 0.35 * Math.sign(g.armTip.y - g.pos.y + 2.5) : 0;
    this.tilt += (wantTilt - this.tilt) * Math.min(1, dt * 1.5);
    this.body.rotation.z = (this.tilt + shuffle - 0.08 * (1 - awake)) * Math.sign(this.flip || 1);
    this.arms.rotation.z = (0.05 + 0.1 * awake) * Math.sin(t * 1.3) + g.stir * 0.2 * Math.sin(t * 7);
    this.tentacleFar.rotation.z = 0.12 * Math.sin(t * 0.9 + 1);
    // The offered tentacle reaches down to the arm's tip and sways a little there.
    this.tentacle.rotation.z = awake * (-0.32 + 0.04 * Math.sin(t * 1.6)) + 0.05 * Math.sin(t * 0.8);
    // Eye: closed while asleep (a peek when it stirs), open once awake, turned a little toward the squid.
    const open = Math.max(0.08, Math.max(awake, g.stir * 0.5));
    const look = Math.atan2(squid.y - g.pos.y, (squid.x - g.pos.x) * Math.sign(this.flip || 1));
    for (const eye of this.eyes) {
      eye.scale.y = open;
      eye.rotation.z = awake * Math.max(-0.35, Math.min(0.35, look * 0.25));
    }
    // The arm's tip glows softly while it waits, inviting a touch.
    if (g.state === 'awake') {
      const tip = g.armTip;
      lights.add(tip.x, tip.y, 0.8, 2.4, ARM_LIGHT, 0.35 + 0.2 * Math.sin(t * 3));
    }
  }
}

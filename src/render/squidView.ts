import * as THREE from 'three';
import { part, type Models } from './models';

export const SQUID_SCALE = 0.27;
const PINEAPPLE_AFTER = 4;

export interface SquidPose {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds since the last player input. */
  idle: number;
  /** 0 → 1 through a bump spin, 0 when not spinning. */
  spin: number;
  /** Glow meter 0 → 1. */
  meter: number;
}

const angleLerp = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;

/**
 * The vampire squid, animated in code from the model's parts: it faces
 * where it swims (head leading, cape trailing), turns to the camera when
 * hovering, pulses its cape with each stroke, flaps its ears, blinks, and
 * curls into the pineapple pose after 4 s without input.
 */
export class SquidView {
  readonly root = new THREE.Group();
  private readonly spinner = new THREE.Group();
  private readonly yaw = new THREE.Group();
  private readonly pitch = new THREE.Group();
  private readonly cape: THREE.Object3D[];
  private readonly head: THREE.Object3D;
  private readonly ears: [THREE.Object3D, THREE.Object3D];
  private readonly eyes: THREE.Object3D[];
  private readonly glow: THREE.MeshStandardMaterial;

  facing = 1;
  private time = 0;
  private stroke = 0;
  private blinkIn = 2;
  private blinkT = 0;
  private curl = 0;
  private flash = 0;

  constructor(models: Models) {
    const model = models.squid.clone(true);
    model.scale.setScalar(SQUID_SCALE);
    this.root.name = 'squid';
    this.root.add(this.spinner);
    this.spinner.add(this.yaw);
    this.yaw.add(this.pitch);
    this.pitch.add(model);
    // Centre the model on its middle rather than its neck.
    model.position.y = 0.05;

    this.cape = ['cape', 'lining', 'arms'].map((n) => part(model, n));
    this.head = part(model, 'head');
    this.ears = [part(model, 'ear-l'), part(model, 'ear-r')];
    this.eyes = [part(model, 'eye-l'), part(model, 'eye-r')];

    // Own copy of the glow material so the tips can follow the meter.
    let glow: THREE.MeshStandardMaterial | null = null;
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m.name === 'Glow') {
        glow ??= m.clone();
        mesh.material = glow;
      }
    });
    this.glow = glow!;
  }

  /** Brief brightening of the tips when the squid glows. */
  pulse(big: boolean): void {
    this.flash = big ? 1 : 0.6;
  }

  get curled(): number {
    return this.curl;
  }

  update(dt: number, s: SquidPose): void {
    this.time += dt;
    const speed = Math.hypot(s.vx, s.vy);
    const moving = speed > 0.6;
    if (Math.abs(s.vx) > 0.4) this.facing = Math.sign(s.vx);

    // Pineapple pose after a while without input; pops open on input.
    const wantCurl = s.idle > PINEAPPLE_AFTER && speed < 0.3 ? 1 : 0;
    this.curl += (wantCurl - this.curl) * (1 - Math.exp(-(wantCurl ? 4 : 14) * dt));

    // Face the travel direction, turn to the camera when hovering.
    const yawTarget = moving && this.curl < 0.5 ? (this.facing * Math.PI) / 2 : 0;
    this.yaw.rotation.y = angleLerp(this.yaw.rotation.y, yawTarget, 1 - Math.exp(-9 * dt));
    const heading = Math.atan2(Math.abs(s.vx), s.vy); // 0 up, π/2 sideways, π down
    const tiltTarget = moving ? THREE.MathUtils.clamp(heading, 0.25, 1.9) * Math.min(1, speed / 2) : 0;
    this.pitch.rotation.x += (tiltTarget - this.pitch.rotation.x) * (1 - Math.exp(-6 * dt));

    // Bump spin around the camera axis.
    this.spinner.rotation.z = s.spin > 0 ? -this.facing * Math.PI * 2 * easeOut(s.spin) : 0;

    // Cape strokes: faster and deeper with speed; a slow breath when hovering.
    const norm = Math.min(1, speed / 4.5);
    this.stroke += dt * (0.7 + 2.3 * norm) * Math.PI * 2;
    const beat = Math.max(0, Math.sin(this.stroke)) ** 1.5 * (0.12 + 0.3 * norm);
    const radial = (1 - beat + 0.06) * (1 - 0.45 * this.curl);
    const length = (1 + 0.12 * beat) * (1 - 1.8 * this.curl);
    for (const c of this.cape) c.scale.set(radial, length, radial);
    this.head.scale.setScalar(1 - 0.08 * this.curl);

    // Ear fins flap, faster when swimming.
    const flap = Math.sin(this.time * (4 + 6 * norm)) * (0.25 + 0.2 * norm) * (1 - this.curl);
    this.ears[0].rotation.z = flap;
    this.ears[1].rotation.z = -flap;

    // Blink every few seconds.
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blinkT = 0.14;
      this.blinkIn = 2.5 + Math.random() * 3;
    }
    this.blinkT = Math.max(0, this.blinkT - dt);
    const lid = this.blinkT > 0 ? 0.12 : 1 - 0.85 * this.curl;
    for (const e of this.eyes) e.scale.y = lid;

    // Hover bob.
    const bob = (1 - norm) * 0.08 * Math.sin(this.time * 1.7);
    this.root.position.set(s.x, s.y + bob, 0);

    this.flash = Math.max(0, this.flash - dt * 1.5);
    this.glow.emissiveIntensity = 0.6 + 2.0 * s.meter + 1.5 * this.flash;
  }
}

const easeOut = (t: number) => 1 - (1 - t) ** 2;

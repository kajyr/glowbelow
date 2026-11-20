import * as THREE from 'three';
import { COLOUR_HEX, type CoralColour } from '../game/colours';
import type { Cuttlefish } from '../game/cuttlefish';
import { TUNING } from '../game/tuning';
import type { CoralPiece } from '../levels/pieces';
import { envMaterial, type LocalLights } from './localLights';
import { part, type Models } from './models';

const CHEER_TIME = TUNING.cuttlefish.cheerTime;
const WIGGLE_TIME = TUNING.cuttlefish.wiggleTime;

/**
 * Colour play on the cuttlefish's own vertex colours: `uHue` turns their hue
 * (its colour cycling), and `uShow` (rgb, amount) floods it with one colour,
 * keeping its light and dark patches (the colour it shows in its game).
 */
function colourPlay(material: THREE.MeshStandardMaterial, uniforms: { uHue: { value: number }; uShow: { value: THREE.Vector4 } }): THREE.MeshStandardMaterial {
  const m = material.clone();
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uHue;
uniform vec4 uShow;
vec3 hueTurn(vec3 c, float a) {
  // Rotation around the grey axis (YIQ), keeps brightness.
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * c;
  float h = atan(yiq.z, yiq.y) + a;
  float chroma = length(yiq.yz);
  return toRGB * vec3(yiq.x, chroma * cos(h), chroma * sin(h));
}`,
      )
      .replace(
        '#include <color_fragment>',
        `#if defined( USE_COLOR )
  vec3 cc = max(hueTurn(vColor, uHue), 0.0);
  float shade = dot(vColor, vec3(0.299, 0.587, 0.114));
  cc = mix(cc, uShow.rgb * (0.55 + 0.6 * shade), uShow.a);
  diffuseColor.rgb *= cc;
#endif`,
      );
  };
  return m;
}

/**
 * The cuttlefish: while disguised, a lone coral in the garden that now and
 * then flickers a colour that does not match; revealed, the coral shrinks
 * away as the cuttlefish swims out. It ripples its fins, sways its arms,
 * blinks, cycles its colours as it swims and, in its game, floods itself
 * with the colour to find, cheers (a spin) and wiggles (a wrong coral).
 */
export class CuttlefishView {
  readonly root = new THREE.Group();
  readonly disguise: THREE.Group;
  private readonly body = new THREE.Group();
  private readonly turn = new THREE.Group();
  private readonly fins: THREE.Object3D[];
  private readonly arms: THREE.Object3D;
  private readonly eyes: THREE.Object3D[];
  private readonly disguiseMats: THREE.MeshStandardMaterial[] = [];
  private readonly uniforms = { uHue: { value: 0 }, uShow: { value: new THREE.Vector4(1, 1, 1, 0) } };
  private readonly showColour = new THREE.Color();
  private show = 0;
  private wantShow = 0;
  private cheer = 0;
  private wiggle = 0;
  private time = 0;
  private blinkIn = 2;
  private blink = 0;

  constructor(
    models: Models,
    hide: { x: number; y: number; piece: CoralPiece },
    private readonly colours: { base: CoralColour; odd: CoralColour },
    lights: LocalLights,
  ) {
    // The disguise: one coral, drawn on its own so it can flicker and shrink away.
    this.disguise = models[hide.piece].clone(true);
    this.disguise.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = envMaterial(mesh.material as THREE.MeshStandardMaterial, lights);
      m.color.set(COLOUR_HEX[colours.base]);
      mesh.material = m;
      this.disguiseMats.push(m);
    });
    this.disguise.position.set(hide.x, hide.y - 0.05, -0.5);
    this.disguise.scale.setScalar(1.3);

    const model = models.cuttlefish.clone(true);
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.material = colourPlay(mesh.material as THREE.MeshStandardMaterial, this.uniforms);
    });
    this.fins = [part(model, 'fin-l'), part(model, 'fin-r')];
    this.arms = part(model, 'arms');
    this.eyes = [part(model, 'eye-l'), part(model, 'eye-r')];
    this.turn.add(model);
    this.body.add(this.turn);
    this.body.scale.setScalar(0);
    this.root.add(this.body);
  }

  /** Shows a colour to find (null: stop showing). */
  setShow(colour: CoralColour | null): void {
    if (colour) this.showColour.set(COLOUR_HEX[colour]);
    this.wantShow = colour ? 1 : 0;
  }

  /** A right coral: a happy spin. */
  cheerUp(): void {
    this.cheer = CHEER_TIME;
  }

  /** A wrong coral: a little wiggle. */
  wiggleNo(): void {
    this.wiggle = WIGGLE_TIME;
  }

  update(dt: number, c: Cuttlefish): void {
    this.time += dt;
    // The disguise: the colour of its neighbours, flickering the odd one out; it shrinks away in the reveal.
    const hex = COLOUR_HEX[c.flickering ? this.colours.odd : this.colours.base];
    for (const m of this.disguiseMats) m.color.set(hex);
    const gone = c.state === 'disguised' ? 0 : Math.min(1, c.reveal / 0.4);
    this.disguise.scale.setScalar(1.3 * (1 - gone));
    this.disguise.visible = gone < 1;

    // The cuttlefish grows in as it leaves the garden, then swims.
    const size = c.state === 'disguised' ? 0 : Math.min(1, c.reveal / 0.5);
    this.body.scale.setScalar(TUNING.cuttlefish.scale * size);
    this.body.visible = size > 0;
    if (!this.body.visible) return;
    const bob = 0.08 * Math.sin(this.time * 1.8);
    this.root.position.set(c.pos.x, c.pos.y + bob, 0.1);
    // Faces where it swims (its model faces +x); turns smoothly.
    const want = c.facing >= 0 ? 0 : Math.PI;
    this.turn.rotation.y += (want - this.turn.rotation.y) * (1 - Math.exp(-6 * dt));

    // A cheer is a full spin; a wiggle a quick shake.
    this.cheer = Math.max(0, this.cheer - dt);
    this.wiggle = Math.max(0, this.wiggle - dt);
    const spin = this.cheer > 0 ? (1 - this.cheer / CHEER_TIME) * Math.PI * 2 : 0;
    this.body.rotation.z = spin + (this.wiggle > 0 ? Math.sin(this.wiggle * 40) * 0.25 * (this.wiggle / WIGGLE_TIME) : 0);

    // Fins ripple, arms sway, eyes blink.
    const ripple = Math.sin(this.time * 7) * 0.35;
    this.fins[0].rotation.x = ripple;
    this.fins[1].rotation.x = -ripple;
    this.arms.rotation.z = Math.sin(this.time * 2.3) * 0.12;
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blink = 0.14;
      this.blinkIn = 2.5 + Math.random() * 3;
    }
    this.blink = Math.max(0, this.blink - dt);
    for (const e of this.eyes) e.scale.y = this.blink > 0 ? 0.15 : 1;

    // Colours: cycling as it swims; flooded with the colour to find in its game (pulsing gently).
    this.uniforms.uHue.value = c.cycle * TUNING.cuttlefish.cycleSpeed * Math.PI * 2;
    this.show += (this.wantShow - this.show) * (1 - Math.exp(-6 * dt));
    this.uniforms.uShow.value.set(this.showColour.r, this.showColour.g, this.showColour.b, this.show * (0.82 + 0.12 * Math.sin(this.time * 4)));
  }
}

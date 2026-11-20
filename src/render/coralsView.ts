import * as THREE from 'three';
import { COLOUR_HEX, type CoralColour } from '../game/colours';
import type { CoralSpot } from '../levels/level';
import type { CoralPiece } from '../levels/pieces';
import { placementMatrix } from './instancing';
import { envMaterial, type LocalLights } from './localLights';
import { modelParts, type Models } from './models';

/** Corals stand just behind the play plane: the squid brushes past in front of them. */
const CORAL_Z = -0.5;
const CHANGE_TIME = 0.35;
const POP_TIME = 0.5;

interface Shown {
  spot: CoralSpot;
  /** Which mesh bucket and instance it is drawn with. */
  bucket: number;
  index: number;
  colour: THREE.Color;
  from: THREE.Color;
  to: THREE.Color;
  /** Counts down through a colour change. */
  change: number;
  /** Counts down through the little pop. */
  pop: number;
}

/**
 * The reef's coral garden. Every coral model is built pale and neutral; each
 * coral is drawn with its own tint (the instance colour multiplies the
 * model's vertex colours), so one model shows any colour of the cycle. A
 * colour change fades over a moment with a little pop. Drawn with instancing,
 * one bucket per model and mirroring (see `instanceModel`).
 */
export class CoralsView {
  readonly group = new THREE.Group();
  private readonly shown: Shown[] = [];
  private readonly buckets: { meshes: THREE.InstancedMesh[]; mirror: boolean; partMatrix: THREE.Matrix4[] }[] = [];
  private readonly tmp = new THREE.Matrix4();
  private readonly mirrorX = new THREE.Matrix4().makeScale(-1, 1, 1);

  constructor(models: Models, spots: CoralSpot[], colourOf: (i: number) => CoralColour, lights: LocalLights) {
    const keys = new Map<string, number>();
    const lists: { piece: CoralPiece; mirror: boolean; spots: number[] }[] = [];
    spots.forEach((spot, i) => {
      const mirror = spot.mirror ?? false;
      const key = `${spot.piece}/${mirror}`;
      let b = keys.get(key);
      if (b === undefined) {
        b = lists.length;
        keys.set(key, b);
        lists.push({ piece: spot.piece, mirror, spots: [] });
      }
      lists[b].spots.push(i);
    });
    const materials = new Map<THREE.Material, THREE.Material>();
    lists.forEach((list, b) => {
      const parts = modelParts(models[list.piece]);
      const meshes = parts.map((part) => {
        let m = materials.get(part.material);
        if (!m) {
          m = envMaterial(part.material, lights);
          materials.set(part.material, m);
        }
        const mesh = new THREE.InstancedMesh(part.geometry, m, list.spots.length);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.frustumCulled = false;
        if (list.mirror) mesh.scale.x = -1;
        mesh.name = list.piece;
        this.group.add(mesh);
        return mesh;
      });
      this.buckets.push({ meshes, mirror: list.mirror, partMatrix: parts.map((p) => p.matrix) });
      list.spots.forEach((i, index) => {
        const c = new THREE.Color(COLOUR_HEX[colourOf(i)]);
        this.shown[i] = { spot: spots[i], bucket: b, index, colour: c.clone(), from: c.clone(), to: c.clone(), change: 0, pop: 0 };
      });
    });
    for (let i = 0; i < this.shown.length; i++) this.draw(i, 1);
    for (const b of this.buckets) for (const m of b.meshes) if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }

  /** A coral changes to a colour, with a little pop. */
  setColour(i: number, colour: CoralColour, pop = true): void {
    const s = this.shown[i];
    s.from.copy(s.colour);
    s.to.set(COLOUR_HEX[colour]);
    s.change = CHANGE_TIME;
    if (pop) s.pop = POP_TIME;
  }

  /** A quick flash of a coral (the colour game's right answer). */
  flash(i: number): void {
    this.shown[i].pop = POP_TIME;
  }

  private draw(i: number, scale: number): void {
    const s = this.shown[i];
    const b = this.buckets[s.bucket];
    const p = s.spot;
    placementMatrix(p.x, p.y, CORAL_Z, p.rot ?? 0, (p.scale ?? 1) * scale, b.mirror, this.tmp);
    if (b.mirror) this.tmp.premultiply(this.mirrorX);
    b.meshes.forEach((mesh, k) => {
      mesh.setMatrixAt(s.index, new THREE.Matrix4().multiplyMatrices(this.tmp, b.partMatrix[k]));
      mesh.setColorAt(s.index, s.colour);
    });
  }

  update(dt: number): void {
    const dirty = new Set<number>();
    this.shown.forEach((s, i) => {
      if (s.change <= 0 && s.pop <= 0) return;
      s.change = Math.max(0, s.change - dt);
      s.pop = Math.max(0, s.pop - dt);
      s.colour.copy(s.from).lerp(s.to, 1 - s.change / CHANGE_TIME);
      const t = 1 - s.pop / POP_TIME;
      this.draw(i, 1 + 0.14 * Math.sin(t * Math.PI) * (s.pop > 0 ? 1 : 0));
      dirty.add(s.bucket);
    });
    for (const b of dirty) {
      for (const m of this.buckets[b].meshes) {
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
      }
    }
  }
}

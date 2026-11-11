import * as THREE from 'three';
import type { Placement, PieceName } from '../levels/pieces';
import { instanceModel, placementMatrix } from './instancing';
import { envMaterial, type LocalLights } from './localLights';
import { modelParts, type Models } from './models';

/**
 * Places the zone's rocks, seabed, arch and cave from the level data. Each
 * model is loaded once; repeats are drawn with instancing.
 */
export function buildWorld(models: Models, pieces: Placement[], lights: LocalLights): THREE.Group {
  const group = new THREE.Group();
  group.name = 'world';
  const byPiece = new Map<PieceName, THREE.Matrix4[]>();
  for (const p of pieces) {
    const list = byPiece.get(p.piece) ?? [];
    list.push(placementMatrix(p.x, p.y, p.z ?? 0, p.rot ?? 0, p.scale ?? 1, p.mirror ?? false));
    byPiece.set(p.piece, list);
  }
  const materials = new Map<THREE.Material, THREE.Material>();
  for (const [piece, matrices] of byPiece) {
    const meshes = instanceModel(modelParts(models[piece]), matrices, (part) => {
      if (part.glow) return part.material;
      let m = materials.get(part.material);
      if (!m) {
        m = envMaterial(part.material, lights);
        materials.set(part.material, m);
      }
      return m;
    });
    meshes.forEach((m) => {
      m.name = piece;
      group.add(m);
    });
  }
  return group;
}

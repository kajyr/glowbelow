import * as THREE from 'three';
import type { Block } from '../game/collision';
import { envMaterial, type LocalLights } from './localLights';

/**
 * The solid rock around and between zones, drawn as dark rock walls just
 * behind the play plane, so no view ever shows empty water outside the
 * world. They use the environment material, so pulses and lights reach them
 * like the rocks; Twilight's ledges and wall rocks break up their edges.
 */
export function buildRockFill(blocks: Block[], lights: LocalLights): THREE.Group {
  const group = new THREE.Group();
  group.name = 'rock-fill';
  const base = new THREE.MeshStandardMaterial({ color: '#262c54', roughness: 0.95, metalness: 0, flatShading: true });
  const material = envMaterial(base, lights);
  material.side = THREE.FrontSide;
  for (const b of blocks) {
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    // A box from well behind the plane to just behind it; a few segments
    // with a little jitter so the face is not perfectly flat.
    const geo = new THREE.BoxGeometry(w, h, 6, Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 4)), 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getZ(i) > 0) pos.setZ(i, pos.getZ(i) + Math.sin(pos.getX(i) * 1.7 + pos.getY(i) * 1.3) * 0.35);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo.toNonIndexed(), material);
    mesh.geometry.computeVertexNormals();
    // Well behind the play plane: the rock columns and ledges along the walls sit in front of it.
    mesh.position.set(b.minX + w / 2, b.minY + h / 2, -5.5);
    group.add(mesh);
  }
  return group;
}

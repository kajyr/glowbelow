import * as THREE from 'three';
import type { ModelPart } from './models';

/** Matrix for a placement on the play plane: position, turn around z, uniform scale, optional mirror. */
export function placementMatrix(x: number, y: number, z: number, rot: number, scale: number, mirror: boolean, out = new THREE.Matrix4()): THREE.Matrix4 {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rot);
  return out.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(mirror ? -scale : scale, scale, scale));
}

/**
 * Draws every placement of a model with InstancedMeshes, one per model part.
 * `material` maps a part's material to the one used in the game.
 *
 * Mirrored placements get their own mesh whose object transform is mirrored:
 * a mirrored instance flips its triangles' winding, and only an object-level
 * mirror makes three.js flip the front face to match. Otherwise the visible
 * faces count as back faces and their normals are inverted, so they render
 * dark.
 */
export function instanceModel(
  parts: ModelPart[],
  placements: THREE.Matrix4[],
  material: (part: ModelPart) => THREE.Material,
): THREE.InstancedMesh[] {
  const mirrorX = new THREE.Matrix4().makeScale(-1, 1, 1);
  const plain = placements.filter((p) => p.determinant() > 0);
  const mirrored = placements.filter((p) => p.determinant() < 0).map((p) => mirrorX.clone().multiply(p));
  const meshes: THREE.InstancedMesh[] = [];
  for (const [list, flip] of [
    [plain, false],
    [mirrored, true],
  ] as const) {
    if (list.length === 0) continue;
    for (const part of parts) {
      const mesh = new THREE.InstancedMesh(part.geometry, material(part), list.length);
      const m = new THREE.Matrix4();
      list.forEach((p, i) => mesh.setMatrixAt(i, m.multiplyMatrices(p, part.matrix)));
      if (flip) mesh.scale.x = -1;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.frustumCulled = false; // instances span the whole zone
      meshes.push(mesh);
    }
  }
  return meshes;
}

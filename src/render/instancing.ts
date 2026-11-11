import * as THREE from 'three';
import type { ModelPart } from './models';

/** Matrix for a placement on the play plane: position, turn around z, uniform scale, optional mirror. */
export function placementMatrix(x: number, y: number, z: number, rot: number, scale: number, mirror: boolean, out = new THREE.Matrix4()): THREE.Matrix4 {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rot);
  return out.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(mirror ? -scale : scale, scale, scale));
}

/**
 * Draws every placement of a model with one InstancedMesh per model part.
 * `material` maps a part's material to the one used in the game.
 */
export function instanceModel(
  parts: ModelPart[],
  placements: THREE.Matrix4[],
  material: (part: ModelPart) => THREE.Material,
): THREE.InstancedMesh[] {
  return parts.map((part) => {
    const mesh = new THREE.InstancedMesh(part.geometry, material(part), placements.length);
    const m = new THREE.Matrix4();
    placements.forEach((p, i) => mesh.setMatrixAt(i, m.multiplyMatrices(p, part.matrix)));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.frustumCulled = false; // instances span the whole zone
    return mesh;
  });
}

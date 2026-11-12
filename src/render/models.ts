import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import squidUrl from '../../models/squid.glb?url';
import dumboUrl from '../../models/dumbo-octopus.glb?url';
import rock1Url from '../../models/rock-1.glb?url';
import rock2Url from '../../models/rock-2.glb?url';
import rock3Url from '../../models/rock-3.glb?url';
import rock4Url from '../../models/rock-4.glb?url';
import seabed1Url from '../../models/seabed-1.glb?url';
import seabed2Url from '../../models/seabed-2.glb?url';
import seabed3Url from '../../models/seabed-3.glb?url';
import archUrl from '../../models/arch.glb?url';
import caveUrl from '../../models/cave.glb?url';
import plantUrl from '../../models/glow-plant.glb?url';
import sparkleUrl from '../../models/sparkle.glb?url';
import jellyUrl from '../../models/phantom-jelly.glb?url';

/** Every model the game uses, imported from models/ so Vite gives each a relative URL. */
export const MODEL_URLS = {
  squid: squidUrl,
  'dumbo-octopus': dumboUrl,
  'rock-1': rock1Url,
  'rock-2': rock2Url,
  'rock-3': rock3Url,
  'rock-4': rock4Url,
  'seabed-1': seabed1Url,
  'seabed-2': seabed2Url,
  'seabed-3': seabed3Url,
  arch: archUrl,
  cave: caveUrl,
  'glow-plant': plantUrl,
  sparkle: sparkleUrl,
  'phantom-jelly': jellyUrl,
} as const;

export type ModelName = keyof typeof MODEL_URLS;
export type Models = Record<ModelName, THREE.Group>;

/** Loads every model once. */
export async function loadModels(): Promise<Models> {
  const loader = new GLTFLoader();
  const entries = await Promise.all(
    (Object.keys(MODEL_URLS) as ModelName[]).map(async (name) => {
      const gltf = await loader.loadAsync(MODEL_URLS[name]);
      return [name, gltf.scene] as const;
    }),
  );
  return Object.fromEntries(entries) as Models;
}

/** One drawable piece of a model: a geometry, its material and its transform inside the model. */
export interface ModelPart {
  node: string;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
  /** Transform from the part to the model root. */
  matrix: THREE.Matrix4;
  /** The part node's own transform (its pivot) relative to the model root. */
  pivot: THREE.Matrix4;
  glow: boolean;
}

/** Flattens a loaded model into its meshes, for instancing. */
export function modelParts(root: THREE.Object3D): ModelPart[] {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const parts: ModelPart[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    // A node with two materials loads as a group (named after the node)
    // holding one mesh per material; a node with one material is the mesh.
    const parent = mesh.parent;
    const node = parent && parent !== root && parent.parent !== root ? parent : mesh;
    const material = mesh.material as THREE.MeshStandardMaterial;
    parts.push({
      node: node.name,
      geometry: mesh.geometry,
      material,
      matrix: inverse.clone().multiply(mesh.matrixWorld),
      pivot: inverse.clone().multiply(node.matrixWorld),
      glow: material.name === 'Glow',
    });
  });
  return parts;
}

/** Finds a named node in a model instance. */
export function part(root: THREE.Object3D, name: string): THREE.Object3D {
  const found = root.getObjectByName(name);
  if (!found) throw new Error(`model part not found: ${name}`);
  return found;
}

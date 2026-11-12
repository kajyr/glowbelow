import * as THREE from 'three';
import type { CollisionWorld } from '../game/collision';
import type { Vec2 } from '../game/vec';
import type { Fields } from '../levels/clearance';
import type { BuiltLevel } from '../levels/level';

/**
 * Debug overlay (open the game with ?debug=1, press C): draws every collider
 * over the models, the seabed line, ceilings, zone bounds, the shaft's soft
 * wall and the cave's discovery circle.
 */
export function colliderOverlay(built: BuiltLevel): THREE.Group {
  const group = new THREE.Group();
  group.name = 'debug-colliders';
  const world: CollisionWorld = built.world;
  const line = (points: THREE.Vector3[], color: string) =>
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, depthTest: false })));

  for (const c of world.circles) {
    const pts = Array.from({ length: 33 }, (_, i) => {
      const a = (i / 32) * Math.PI * 2;
      return new THREE.Vector3(c.x + Math.cos(a) * c.r, c.y + Math.sin(a) * c.r, 1);
    });
    line(pts, '#ff5ab4');
  }
  line(world.floor.xs.map((x, i) => new THREE.Vector3(x, world.floor.ys[i], 1)), '#ffd84a');
  for (const c of world.ceilings) line([new THREE.Vector3(c.x0, c.y, 1), new THREE.Vector3(c.x1, c.y, 1)], '#ffd84a');
  const b = world.bounds;
  line(
    [
      new THREE.Vector3(b.minX, b.minY, 1),
      new THREE.Vector3(b.maxX, b.minY, 1),
      new THREE.Vector3(b.maxX, b.maxY, 1),
      new THREE.Vector3(b.minX, b.maxY, 1),
      new THREE.Vector3(b.minX, b.minY, 1),
    ],
    '#4affb4',
  );
  const s = built.level.shaft;
  line([new THREE.Vector3(s.x0, s.softFrom, 1), new THREE.Vector3(s.x1, s.softFrom, 1)], '#4ac8ff');
  const cave = built.level.cave;
  line(
    Array.from({ length: 33 }, (_, i) => {
      const a = (i / 32) * Math.PI * 2;
      return new THREE.Vector3(cave.x + Math.cos(a) * cave.r, cave.y + Math.sin(a) * cave.r, 1);
    }),
    '#ffa04a',
  );
  group.renderOrder = 999;
  group.visible = false;
  return group;
}

/**
 * Debug overlay (?debug=1, press G): the comfortably reachable water (the
 * validator's wide field, green dots), the routes the sparkle trails follow
 * (yellow lines) and where the phantom jelly may roam (magenta dots).
 */
export function reachOverlay(fields: Fields, paths: Vec2[][], jellyCells: Vec2[] | null = null): THREE.Group {
  const group = new THREE.Group();
  group.name = 'debug-reach';
  const pts: number[] = [];
  for (let iy = 0; iy < fields.rows; iy++) {
    for (let ix = 0; ix < fields.cols; ix++) {
      if (fields.wideReach[fields.idx(ix, iy)]) pts.push(fields.cx(ix), fields.cy(iy), 0.9);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  group.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: '#3cff9a', size: 2, sizeAttenuation: false, depthTest: false, transparent: true, opacity: 0.5 })));
  for (const path of paths) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(path.map((p) => new THREE.Vector3(p.x, p.y, 1))),
      new THREE.LineBasicMaterial({ color: '#ffe14a', depthTest: false }),
    );
    group.add(line);
  }
  if (jellyCells) {
    // Where the phantom jelly may roam (magenta dots).
    const jg = new THREE.BufferGeometry();
    jg.setAttribute('position', new THREE.Float32BufferAttribute(jellyCells.flatMap((c) => [c.x, c.y, 1]), 3));
    group.add(new THREE.Points(jg, new THREE.PointsMaterial({ color: '#ff4ae0', size: 3, sizeAttenuation: false, depthTest: false })));
  }
  group.renderOrder = 998;
  group.visible = false;
  return group;
}

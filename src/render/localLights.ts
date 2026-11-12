import * as THREE from 'three';
import { selectLights, type LightCandidate } from '../game/lightCulling';
import type { Rect } from '../game/sparkleField';

export const MAX_LOCAL_LIGHTS = 32;

/**
 * Cheap local lights for the environment: lit plants, pulses and the squid's
 * own glow add light around them without real three.js lights (dozens of
 * those would be too slow on a tablet). The environment material reads them
 * from uniforms. `ambient` scales the regular scene lighting on the
 * environment, which keeps the zone dark while the creatures stay lit like
 * in the model viewer.
 */
export class LocalLights {
  private readonly pos = Array.from({ length: MAX_LOCAL_LIGHTS }, () => new THREE.Vector4());
  private readonly col = Array.from({ length: MAX_LOCAL_LIGHTS }, () => new THREE.Vector4());
  readonly uniforms = {
    uLightPos: { value: this.pos },
    uLightCol: { value: this.col },
    uLightCount: { value: 0 },
    uAmbient: { value: 0.4 },
  };
  private candidates: (LightCandidate & { z: number; color: THREE.Color; intensity: number; edge: number })[] = [];

  begin(): void {
    this.candidates = [];
  }

  /**
   * Asks for a light this frame. `edge` 0 gives a soft falloff over the whole
   * radius; closer to 1 gives a flat disk with a soft rim (pulses). `priority`
   * lights (the squid, pulses) are always used first.
   */
  add(x: number, y: number, z: number, radius: number, color: THREE.Color, intensity: number, edge = 0, priority = false): void {
    if (intensity <= 0.001) return;
    this.candidates.push({ x, y, z, radius, color, intensity, edge, priority });
  }

  /** Uses the lights near the camera view, up to the slot limit. */
  end(ambient: number, view?: Rect): void {
    const chosen = view ? selectLights(this.candidates, view, MAX_LOCAL_LIGHTS) : this.candidates.slice(0, MAX_LOCAL_LIGHTS);
    chosen.forEach((l, i) => {
      this.pos[i].set(l.x, l.y, l.z, l.radius);
      this.col[i].set(l.color.r * l.intensity, l.color.g * l.intensity, l.color.b * l.intensity, l.edge);
    });
    this.uniforms.uLightCount.value = chosen.length;
    this.uniforms.uAmbient.value = ambient;
  }
}

/** A copy of a model's body material that takes the local lights. */
export function envMaterial(base: THREE.MeshStandardMaterial, lights: LocalLights): THREE.MeshStandardMaterial {
  const m = base.clone();
  m.side = THREE.DoubleSide; // mirrored instances flip their winding
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lights.uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vEnvWorld;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 envW = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          envW = instanceMatrix * envW;
        #endif
        vEnvWorld = ( modelMatrix * envW ).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vEnvWorld;
        uniform vec4 uLightPos[${MAX_LOCAL_LIGHTS}];
        uniform vec4 uLightCol[${MAX_LOCAL_LIGHTS}];
        uniform int uLightCount;
        uniform float uAmbient;`,
      )
      .replace(
        '#include <opaque_fragment>',
        `outgoingLight *= uAmbient;
        vec3 envLocal = vec3( 0.0 );
        for ( int i = 0; i < ${MAX_LOCAL_LIGHTS}; i++ ) {
          if ( i >= uLightCount ) break;
          vec4 p = uLightPos[ i ];
          vec4 c = uLightCol[ i ];
          float d = distance( vEnvWorld, p.xyz );
          float f = 1.0 - smoothstep( p.w * c.w, p.w, d );
          envLocal += c.rgb * ( c.w > 0.0 ? f : f * f );
        }
        outgoingLight += diffuseColor.rgb * envLocal;
        #include <opaque_fragment>`,
      );
  };
  m.customProgramCacheKey = () => 'env-local-lights';
  return m;
}

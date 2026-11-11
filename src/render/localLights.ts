import * as THREE from 'three';

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
  private count = 0;

  begin(): void {
    this.count = 0;
  }

  /**
   * Adds a light for this frame. `edge` 0 gives a soft falloff over the whole
   * radius; closer to 1 gives a flat disk with a soft rim (pulses).
   */
  add(x: number, y: number, z: number, radius: number, color: THREE.Color, intensity: number, edge = 0): void {
    if (this.count >= MAX_LOCAL_LIGHTS || intensity <= 0.001) return;
    this.pos[this.count].set(x, y, z, radius);
    this.col[this.count].set(color.r * intensity, color.g * intensity, color.b * intensity, edge);
    this.count++;
  }

  end(ambient: number): void {
    this.uniforms.uLightCount.value = this.count;
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

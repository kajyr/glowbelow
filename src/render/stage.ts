import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/** World units visible from the bottom to the top of the screen at the play plane. */
export const VIEW_HEIGHT = 11;
const FOV = 35;
export const CAMERA_DISTANCE = VIEW_HEIGHT / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
export const WATER = new THREE.Color('#041233');

/**
 * Renderer, scene, side-on camera, the model viewer's three lights, fog and
 * bloom. Sizes itself to its container (not the screen), so it works inside
 * an iframe.
 */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.5, 120);
  readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  bloomOn: boolean;
  width = 1;
  height = 1;
  /** Called after every resize with the new size in CSS pixels. */
  onResize: (w: number, h: number) => void = () => {};

  // Frame-time watch for the automatic bloom fallback.
  private slowTime = 0;
  private avgFrame = 1 / 60;

  constructor(private readonly container: HTMLElement, opts: { bloom: boolean }) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.className = 'stage';
    container.appendChild(this.renderer.domElement);

    this.scene.background = WATER;
    this.scene.fog = new THREE.Fog(WATER, CAMERA_DISTANCE + 1, CAMERA_DISTANCE + 22);

    // Same lights as tools/viewer.html.
    this.scene.add(new THREE.HemisphereLight('#cfe6ff', '#3a4a80', 2.4));
    const key = new THREE.DirectionalLight('#ffffff', 3.0);
    key.position.set(-4, 6, 8);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight('#ffd9c2', 1.6);
    fill.position.set(0, -6, 5);
    this.scene.add(fill);

    this.camera.position.set(0, 0, CAMERA_DISTANCE);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // High threshold: the water is dark, so only emissive things bloom.
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.6, 0.8);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.bloomOn = opts.bloom;

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
  }

  resize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h);
    // UnrealBloomPass already blurs at half resolution and below.
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.onResize(w, h);
  }

  /** Half the visible width and height at the play plane. */
  get halfView(): { w: number; h: number } {
    return { w: (VIEW_HEIGHT / 2) * this.camera.aspect, h: VIEW_HEIGHT / 2 };
  }

  /** Screen position (CSS pixels) of a world point. */
  toScreen(p: THREE.Vector3): { x: number; y: number } {
    const v = p.clone().project(this.camera);
    return { x: ((v.x + 1) / 2) * this.width, y: ((1 - v.y) / 2) * this.height };
  }

  /** World point on the play plane under a screen position (CSS pixels). */
  toWorld(sx: number, sy: number): { x: number; y: number } {
    const ndc = new THREE.Vector3((sx / this.width) * 2 - 1, 1 - (sy / this.height) * 2, 0.5);
    ndc.unproject(this.camera);
    const dir = ndc.sub(this.camera.position).normalize();
    const t = -this.camera.position.z / dir.z;
    return { x: this.camera.position.x + dir.x * t, y: this.camera.position.y + dir.y * t };
  }

  /**
   * Renders a frame. `frameTime` is the real time since the last frame; if it
   * stays over budget for a few seconds, bloom switches off for good.
   */
  render(frameTime: number): void {
    this.avgFrame += (Math.min(frameTime, 0.25) - this.avgFrame) * 0.05;
    if (this.bloomOn) {
      this.slowTime = this.avgFrame > 1 / 45 ? this.slowTime + frameTime : 0;
      if (this.slowTime > 3) {
        this.bloomOn = false;
        console.info('[stage] frame time over budget: bloom off');
      }
    }
    if (this.bloomOn) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}

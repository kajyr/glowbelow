import * as THREE from 'three';
import { Synth } from './audio/synth';
import { BumpState } from './game/bump';
import { collide } from './game/collision';
import { DumboBrain } from './game/dumboBrain';
import { GlowMeter } from './game/glowMeter';
import { Hints, type InputKind } from './game/hints';
import { PulseSystem } from './game/pulse';
import { shaftPush } from './game/shaft';
import { SparkleField } from './game/sparkleField';
import { steer, type Body, type SteerInput } from './game/steering';
import { TUNING } from './game/tuning';
import { Input } from './input';
import { generateValidZone } from './levels/generateValid';
import { buildLevel, sparkleBounds } from './levels/level';
import { MIDNIGHT_HOME } from './levels/zoneRecipe';
import { CameraRig } from './render/cameraRig';
import { colliderOverlay, reachOverlay } from './render/debug';
import { DumboView } from './render/dumboView';
import { Effects } from './render/effects';
import { LocalLights } from './render/localLights';
import { loadModels } from './render/models';
import { PlantsView } from './render/plants';
import { SparklesView } from './render/sparklesView';
import { SquidView } from './render/squidView';
import { CAMERA_DISTANCE, Stage } from './render/stage';
import { buildWorld } from './render/world';
import { Hud } from './ui/hud';

const STEP = 1 / 60;
const SQUID_LIGHT = new THREE.Color('#5dcaa5');

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

const container = document.getElementById('game') as HTMLElement;

// ------------------------------------------------- keep the browser out of the way
const stop = (e: Event) => e.preventDefault();
document.addEventListener('gesturestart', stop); // iOS pinch
document.addEventListener('dblclick', stop);
container.addEventListener('contextmenu', stop);
container.addEventListener('touchmove', stop, { passive: false });
container.addEventListener('touchstart', (e) => e.touches.length > 1 && e.preventDefault(), { passive: false });

async function boot() {
  const stage = new Stage(container, { bloom: !params.has('nobloom') });
  const hud = new Hud(container);
  const synth = new Synth();
  const lights = new LocalLights();
  // The world's seed: ?seed= picks one (testing, sharing a favourite world), otherwise a new one per game.
  const seedParam = params.get('seed');
  const worldSeed = seedParam !== null && seedParam !== '' && !Number.isNaN(Number(seedParam)) ? Number(seedParam) >>> 0 : Math.floor(Math.random() * 2 ** 32);
  const genStart = performance.now();
  const zone = generateValidZone(MIDNIGHT_HOME, worldSeed);
  const genMs = performance.now() - genStart;
  if (DEBUG) console.info(`[zone] seed ${worldSeed}${zone.seed !== worldSeed ? ` (layout from ${zone.seed}, ${zone.attempts} tries)` : ''}, generated in ${genMs.toFixed(1)} ms`);
  const built = buildLevel(zone.layout.level);
  const level = built.level;
  const models = await loadModels();

  // ------------------------------------------------------------ scene
  const scene = stage.scene;
  scene.add(buildWorld(models, level.pieces, lights));
  const plants = new PlantsView(models, built.plants, lights);
  scene.add(plants.group);
  const squidView = new SquidView(models);
  scene.add(squidView.root);
  const brain = new DumboBrain({ ...level.cave.eyes }, built.floor);
  const dumboView = new DumboView(models, level.cave.eyes);
  scene.add(dumboView.root, dumboView.caveEyes);
  const field = new SparkleField({
    bounds: sparkleBounds(level),
    floor: built.floor,
    trails: level.trails.flat(),
    // ?sparkles=N (debug) sets the number of drifting sparkles, for load checks.
    count: DEBUG && params.has('sparkles') ? Number(params.get('sparkles')) : undefined,
  });
  const sparkles = new SparklesView(models, field);
  scene.add(sparkles.mesh);
  const effects = new Effects(level.bounds, level.bubbleVents, level.shaft);
  scene.add(effects.group);
  const overlay = colliderOverlay(built);
  const reach = reachOverlay(zone.fields, zone.paths);
  scene.add(overlay, reach);
  const fog = scene.fog;
  let overview = false;
  const rig = new CameraRig(stage, level.cameraBounds);

  // ------------------------------------------------------------ state
  const body: Body = { pos: { ...level.start }, vel: { x: 0, y: 0 } };
  const meter = new GlowMeter();
  const pulses = new PulseSystem();
  const bump = new BumpState();
  const input = new Input(container, (t) => hud.isControl(t));
  const hints = new Hints(input.last);
  let mode: 'title' | 'play' = 'title';
  let paused = false;
  let idle = 0;
  let muted = false;
  let celebrated = false;
  let zoom = 0; // 0 on the title (closer), 1 in play
  let logicSteps = 0;

  rig.snap(body.pos);
  stage.onResize = (w, h) => {
    effects.setPixelScale(h);
    const portrait = h > w;
    hud.setPortrait(portrait);
    if (portrait !== paused) input.reset();
    paused = portrait;
  };
  stage.resize();

  // ------------------------------------------------------------ controls
  /** Starts play; `kind` is the input used to start, which picks the hint icons. */
  const start = (kind: InputKind) => {
    if (mode !== 'title' || paused) return;
    mode = 'play';
    synth.start();
    hud.setPlaying(true);
    container.focus({ preventScroll: true });
    input.consume(); // the start press is not a glow
    input.last = kind;
    hints.icons = kind;
    idle = 0;
  };
  hud.title.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    // A mouse click on a laptop keeps the keyboard hints; a finger shows the drag hint.
    start(e.pointerType === 'touch' ? 'touch' : input.last);
  });

  const toggleMute = () => {
    muted = !muted;
    synth.setMuted(muted);
    hud.setMuted(muted);
  };
  hud.mute.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMute();
  });
  hud.album.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hud.wiggleAlbum();
  });
  hud.glow.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    input.glow(e.pointerType === 'mouse' ? input.last : 'touch');
  });

  input.onKey = (code) => {
    if (code === 'KeyM') toggleMute();
    if (mode === 'title' && (code === 'Space' || code === 'Enter')) start('keyboard');
    if (DEBUG && code === 'KeyC') overlay.visible = !overlay.visible;
    if (DEBUG && code === 'KeyG') reach.visible = !reach.visible;
    if (DEBUG && code === 'KeyO') {
      overview = !overview;
      scene.fog = overview ? null : fog;
    }
    if (DEBUG && code === 'KeyL') plants.plants.forEach((p, i) => setTimeout(() => touchPlant(p.id), i * 60));
  };

  // ------------------------------------------------------------ events
  function touchPlant(id: string) {
    const r = plants.touch(id);
    if (r === 'bloom') {
      synth.bloom();
      if (plants.allLit && !celebrated) celebrate();
    }
  }

  function celebrate() {
    celebrated = true;
    // A wave of light runs out from the squid across every plant.
    for (const p of plants.plants) plants.flashAfter(p.id, 1 + Math.abs(p.x - body.pos.x) / 14);
    setTimeout(() => synth.chord(), 900);
    if (brain.state === 'following') setTimeout(() => dumboView.happySpin(), 1200);
  }

  function discoverDumbo() {
    if (!brain.discover()) return;
    synth.flute();
    dumboView.happySpin();
    setTimeout(() => {
      const at = stage.toScreen(new THREE.Vector3(brain.pos.x, brain.pos.y + 0.6, 0));
      hud.stickerFly(at);
    }, 700);
  }

  const plantTargets = built.plants.map((p) => ({ id: p.id, x: p.x, y: p.y + 0.8, r: 0.5 }));
  const caveTarget = { id: 'cave', x: level.cave.x, y: level.cave.y, r: level.cave.r };

  // ------------------------------------------------------------ logic (60 Hz)
  function logic(dt: number) {
    logicSteps++;
    if (mode !== 'play' || paused) {
      input.consume();
      return;
    }
    const ev = input.consume();
    const steerIn: SteerInput = bump.locked ? { kind: 'none' } : input.steer((x, y) => stage.toWorld(x, y));
    const steering = steerIn.kind !== 'none';

    // Tapping or clicking the squid itself glows.
    let glowAsk = ev.glow;
    if (ev.tap) {
      const s = stage.toScreen(new THREE.Vector3(body.pos.x, body.pos.y, 0));
      if (Math.hypot(ev.tap.x - s.x, ev.tap.y - s.y) < Math.max(56, stage.height * 0.09)) glowAsk = true;
    }

    if (steering || ev.any) idle = 0;
    else idle += dt;

    steer(body, steerIn, dt);
    const contact = collide(body, TUNING.squid.radius, built.world, dt);
    shaftPush(body, level.shaft, dt);
    if (bump.update(contact, dt) && contact) {
      sparkles.cloud(body.pos.x, body.pos.y);
      synth.boing();
      body.vel.x += contact.normal.x * contact.impactSpeed * TUNING.bump.bounce;
      body.vel.y += contact.normal.y * contact.impactSpeed * TUNING.bump.bounce;
    }

    for (const at of field.update(dt, body.pos, rig.view())) {
      meter.add();
      synth.sparkle();
      sparkles.pop(at.x, at.y);
    }

    let glowed = false;
    if (glowAsk) {
      const p = pulses.trigger(body.pos, meter.full);
      if (p) {
        glowed = true;
        if (p.kind === 'big') meter.empty();
        synth.whoom(p.kind === 'big');
        squidView.pulse(p.kind === 'big');
        hud.glowFlash();
        if (brain.state === 'following') dumboView.hop();
      }
    }
    pulses.update(dt);
    for (const id of pulses.sweep([...plantTargets, caveTarget])) {
      if (id === 'cave') discoverDumbo();
      else touchPlant(id);
    }

    const dumboEvent = brain.update(
      dt,
      { pos: body.pos, vel: body.vel, facing: squidView.facing },
      plants.plants.map((p) => ({ id: p.id, x: p.x, y: p.y, lit: p.state !== 'unlit' })),
    );
    if (dumboEvent?.kind === 'point') synth.flute();
    if (dumboEvent?.kind === 'spin') dumboView.happySpin();

    const speed = Math.hypot(body.vel.x, body.vel.y);
    hints.update(dt, {
      moving: steering && speed > 0.5,
      anyInput: steering || ev.any,
      glowed,
      meterFull: meter.full,
      inputKind: ev.kind,
    });
  }

  // ------------------------------------------------------------ render (every frame)
  const debugText = DEBUG ? document.createElement('div') : null;
  if (debugText) {
    debugText.style.cssText = 'position:absolute;left:96px;top:14px;font:12px monospace;color:#9fe;pointer-events:none;white-space:pre';
    container.appendChild(debugText);
  }
  let frames = 0;
  let statT = 0;

  function render(frameDt: number) {
    const lit = plants.litCount / plants.plants.length;
    lights.begin();
    lights.add(body.pos.x, body.pos.y, 1.2, 2.8, SQUID_LIGHT, 0.2 + 0.4 * meter.value, 0, true);
    plants.update(frameDt, lights);
    effects.update(frameDt, stage.camera, pulses.active, lights);
    lights.end(0.24 + 0.46 * lit, rig.view());

    squidView.update(frameDt, {
      x: body.pos.x,
      y: body.pos.y,
      vx: body.vel.x,
      vy: body.vel.y,
      idle: mode === 'play' ? idle : 0,
      spin: bump.spinProgress,
      meter: meter.value,
    });
    dumboView.update(frameDt, brain);
    sparkles.update(frameDt);

    // The camera eases in from the title close-up.
    zoom += ((mode === 'play' ? 1 : 0) - zoom) * (1 - Math.exp(-4 * frameDt));
    if (mode === 'play') rig.follow(body.pos, frameDt, input.holding);
    else rig.centreOn({ x: body.pos.x, y: body.pos.y - 0.3 });
    stage.camera.position.z = CAMERA_DISTANCE * (0.62 + 0.38 * zoom);
    if (overview) {
      // Debug: the whole zone at once.
      const b = level.cameraBounds;
      const span = Math.max(b.maxY - b.minY, (b.maxX - b.minX) / stage.camera.aspect) * 1.05;
      stage.camera.position.set((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (CAMERA_DISTANCE * span) / 11);
      stage.camera.lookAt((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, 0);
    }

    const squidScreen = stage.toScreen(new THREE.Vector3(body.pos.x, body.pos.y, 0));
    const play = mode === 'play';
    hud.setMeter(meter.value, play && (meter.full || hints.glowVisible));
    hud.setHints(play && hints.moveVisible, play && hints.glowVisible, hints.icons, squidScreen);
    synth.setBrightness(lit);

    stage.render(frameDt);

    if (debugText) {
      frames++;
      statT += frameDt;
      if (statT >= 1) {
        debugText.textContent = `fps ${Math.round(frames / statT)}  logic ${Math.round(logicSteps / statT)} Hz  bloom ${stage.bloomOn ? 'on' : 'off'}\nlit ${plants.litCount}/${plants.plants.length}  meter ${meter.value.toFixed(2)}  dumbo ${brain.state}  [C] colliders  [G] reach  [O] overview  [L] light all`;
        frames = 0;
        logicSteps = 0;
        statT = 0;
      }
    }
  }

  // ------------------------------------------------------------ loop
  let last = performance.now();
  let acc = 0;
  const frame = (now: number) => {
    const frameDt = Math.min(0.25, (now - last) / 1000);
    last = now;
    acc += frameDt;
    while (acc >= STEP) {
      logic(STEP);
      acc -= STEP;
    }
    render(paused ? 0 : frameDt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // Expose for manual testing in the console.
  if (DEBUG) Object.assign(window, { game: { body, meter, plants, brain, field, stage, pulses, hints, synth, rig, zone, worldSeed, genMs } });
}

boot().catch((err) => {
  console.error(err);
  container.textContent = '';
});

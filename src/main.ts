import * as THREE from 'three';
import { Synth } from './audio/synth';
import { BumpState } from './game/bump';
import { Dash, dashDirection } from './game/dash';
import { collide } from './game/collision';
import { DumboBrain } from './game/dumboBrain';
import { GlowMeter } from './game/glowMeter';
import { brighten, moodColor, twilightness, worldMood } from './game/mood';
import { LIGHTABLE, type GlowTarget } from './game/glowTargets';
import { Jelly } from './game/jelly';
import { Hints, type InputKind } from './game/hints';
import { PulseSystem } from './game/pulse';
import { shaftPush } from './game/shaft';
import { SparkleField } from './game/sparkleField';
import { steer, type Body, type SteerInput } from './game/steering';
import { fireflyGroupId, Swarm } from './game/swarm';
import { Nautilus } from './game/nautilus';
import { BubbleRings } from './game/bubbleRings';
import { TUNING } from './game/tuning';
import { WorldState, type CreatureName, type StampName } from './game/worldState';
import { browserStorage, clearSave, loadSave, Saver, saveUnavailableHere } from './game/save';
import { loadVolumes, saveVolumes } from './game/settings';
import { ParentCorner } from './ui/parentCorner';
import { Album, stampArt } from './ui/album';
import { Input } from './input';
import { generateWorld } from './levels/assembleWorld';
import { JellyFreeArea } from './levels/jellyArea';
import { buildLevel, sparkleBounds } from './levels/level';
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
import { buildRockFill } from './render/rockFill';
import { LanternsView, lanternId } from './render/lanterns';
import { FireflyView } from './render/fireflyView';
import { NautilusView } from './render/nautilusView';
import { RingsView } from './render/ringsView';
import { StarfishView } from './render/starfishView';
import { starfishIds } from './levels/ids';
import { zoneAt } from './levels/world';
import { Hud } from './ui/hud';
import { STICKER_DUMBO, STICKER_FIREFLY, STICKER_NAUTILUS } from './ui/icons';
import { JellyView } from './render/jellyView';

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
  // A saved game continues: its seed regenerates the same world. ?seed= picks a
  // world instead (testing, sharing a favourite one) and starts it fresh.
  const storage = browserStorage();
  const seedParam = params.get('seed');
  const forcedSeed = seedParam !== null && seedParam !== '' && !Number.isNaN(Number(seedParam)) ? Number(seedParam) >>> 0 : null;
  const saved = forcedSeed === null ? loadSave(storage) : null;
  const worldSeed = saved?.state.seed ?? forcedSeed ?? Math.floor(Math.random() * 2 ** 32);
  const genStart = performance.now();
  // The whole world: home, and Twilight above it through the shaft.
  const gameWorld = generateWorld(worldSeed);
  const zone = gameWorld.home;
  const genMs = performance.now() - genStart;
  if (DEBUG) console.info(`[world] seed ${worldSeed} (home from ${zone.seed}, ${zone.attempts} tries; twilight ${gameWorld.twilight.attempts} tries), generated in ${genMs.toFixed(1)} ms`);
  const built = buildLevel(gameWorld.level);
  const level = built.level;
  const models = await loadModels();

  // ------------------------------------------------------------ scene
  const scene = stage.scene;
  scene.add(buildWorld(models, level.pieces, lights));
  scene.add(buildRockFill(level.blocks ?? [], lights));
  // Everything that changes as the player plays (lit things, found friends) lives here.
  const worldState = saved?.state ?? new WorldState(worldSeed);
  if (DEBUG && saved) console.info(`[save] continuing in ${saved.zone}${saved.relayout ? ' (older layout: lit things dropped)' : ''}`);
  const plants = new PlantsView(models, built.plants, lights, worldState);
  const lanterns = new LanternsView(models, level.lanterns ?? [], lights, worldState);
  scene.add(lanterns.group);
  scene.add(plants.group);
  const squidView = new SquidView(models);
  scene.add(squidView.root);
  // Home always has the cave where dumbo hides.
  const cave = level.cave;
  if (!cave) throw new Error('Midnight home has no cave');
  const brain = new DumboBrain({ ...cave.eyes }, built.floor);
  const dumboView = new DumboView(models, cave.eyes);
  scene.add(dumboView.root, dumboView.caveEyes);
  // The firefly squid: five groups in Twilight that join the swarm when glowed at.
  const swarm = new Swarm(level.fireflyGroups ?? [], level.start);
  const fireflyView = new FireflyView(models, swarm, lights);
  scene.add(fireflyView.group);
  // The nautilus cruising up and down Twilight.
  const nautilus = level.nautilus ? new Nautilus(level.nautilus) : null;
  const nautilusView = nautilus ? new NautilusView(models) : null;
  if (nautilusView) scene.add(nautilusView.root);
  // Bubble rings to swim through: a toy, nothing to count.
  const rings = new BubbleRings(level.rings ?? []);
  const ringsView = new RingsView(models, rings);
  scene.add(ringsView.group);
  // Shy starfish on rocks and the seabed, found by glowing near them.
  const starIds = starfishIds(level.starfish ?? []);
  const starfish = new StarfishView(models, level.starfish ?? [], starIds, lights, worldState);
  scene.add(starfish.group);
  const field = new SparkleField({
    // Sparkles drift in each zone's water, never in the rock between them.
    bounds: [sparkleBounds(zone.layout.level), ...gameWorld.map.zones.filter((z) => z.name !== 'home').map((z) => ({ minX: z.rect.minX + 1, maxX: z.rect.maxX - 1, minY: z.rect.minY + 1, maxY: z.rect.maxY - 5 }))],
    floor: built.floor,
    trails: level.trails.flat(),
    // ?sparkles=N (debug) sets the number of drifting sparkles, for load checks.
    count: DEBUG && params.has('sparkles') ? Number(params.get('sparkles')) : undefined,
  });
  const sparkles = new SparklesView(models, field);
  // The phantom jelly roams freely inside the open water where it fits.
  const jellyArea = level.jelly ? new JellyFreeArea(zone.layout, zone.fields) : null;
  const jelly = level.jelly && jellyArea ? new Jelly(jellyArea, level.jelly.start, zone.seed) : null;
  const jellyView = jelly ? new JellyView(models, lights) : null;
  if (jellyView) scene.add(jellyView.root);
  scene.add(sparkles.mesh);
  const effects = new Effects(level.bounds, level.bubbleVents, level.shaft);
  scene.add(effects.group);
  const overlay = colliderOverlay(built);
  const reach = reachOverlay(zone.fields, zone.paths, jellyArea?.cells ?? null);
  scene.add(overlay, reach);
  const fog = scene.fog as THREE.Fog;
  // Water colour by height: home's navy up to Twilight's lavender.
  const homeTop = gameWorld.map.zones[1].rect.minY;
  const moodStops = worldMood(homeTop, gameWorld.map.bounds.maxY);
  const water = new THREE.Color();
  scene.background = water;
  let overview = false;
  const rig = new CameraRig(stage, level.cameraBounds);

  // ------------------------------------------------------------ state
  // A continued game starts at the entry of the zone it was left in.
  const passage = gameWorld.map.passages[0].rect;
  const twilightEntry = { x: (passage.minX + passage.maxX) / 2, y: gameWorld.map.zones[1].rect.minY + 3 };
  const entry = saved?.zone === 'twilight' ? twilightEntry : level.start;
  const body: Body = { pos: { ...entry }, vel: { x: 0, y: 0 } };
  // Friends already found come back with the squid.
  if (worldState.hasFound('dumbo')) brain.restore({ x: entry.x - 1.8, y: entry.y + 0.5 });
  if (nautilus && worldState.hasFound('nautilus')) nautilus.found = true;
  swarm.groups.forEach((_g, i) => worldState.hasJoined(fireflyGroupId(i)) && swarm.restore(i, { x: entry.x - 2, y: entry.y - 0.4 }));
  // Saves about a second after any change, at once when the page is hidden.
  let zoneNow = zoneAt(gameWorld.map, body.pos) ?? 'home';
  const saver = new Saver(storage, worldState, () => zoneNow);
  worldState.onChange = () => saver.request();
  const flushSave = () => saver.flush();
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flushSave());
  window.addEventListener('pagehide', flushSave);

  // The parent corner: volumes (settings, kept on start over), start over, and the frame note.
  const volumes = loadVolumes(storage);
  synth.setVolumes(volumes.music, volumes.effects);
  // Play pauses while the album or the parent corner is open.
  let overlayOpen = false;
  const overlayChanged = () => {
    overlayOpen = album.open || parent.open;
    synth.setDucked(overlayOpen);
    input.reset();
  };
  const parent = new ParentCorner(container, volumes, {
    onVolumes: (v) => {
      synth.setVolumes(v.music, v.effects);
      saveVolumes(storage, v);
    },
    onReset: () => {
      saver.disable();
      clearSave(storage);
      location.reload();
    },
    onOpenChange: overlayChanged,
  });
  // The sticker album: a stamp per friend and sea creature, each playing its sound when tapped.
  const stampSounds: Partial<Record<StampName, () => void>> = {
    dumbo: () => synth.flute(),
    firefly: () => synth.fireflyChimes(),
    nautilus: () => synth.nautilus(),
    starfish: () => synth.starfish(),
    'phantom-jelly': () => synth.jellyBoing(),
    'lantern-jelly': () => synth.lantern(),
  };
  const album = new Album(container, worldState, {
    onStampSound: (s) => stampSounds[s]?.(),
    onOpenChange: overlayChanged,
    onBadge: (show) => hud.setBadge(show),
  }, [
    { zone: 'home', tint: '#0b2150', ids: starfish.idsIn('home') },
    { zone: 'twilight', tint: '#3b3f8f', ids: starfish.idsIn('twilight') },
  ]);
  // Inside another site's frame (itch.io), the browser may block storage: tell the grown-ups.
  const framed = (() => {
    try {
      return window.top !== window.self;
    } catch {
      return true;
    }
  })();
  parent.setSaveUnavailable(saveUnavailableHere(framed, storage));
  const meter = new GlowMeter();
  const pulses = new PulseSystem();
  const bump = new BumpState();
  const dash = new Dash();
  const input = new Input(container, (t) => hud.isControl(t));
  const hints = new Hints(input.last);
  let mode: 'title' | 'play' = 'title';
  let paused = false;
  let idle = 0;
  // A remembered choice wins; otherwise debug sessions start silent.
  let muted = DEBUG;
  try {
    const saved = localStorage.getItem('glowbelow.muted');
    if (saved !== null) muted = saved === '1';
  } catch { /* storage unavailable: keep the default */ }
  // A continued game where everything was lit has already celebrated.
  let celebrated = plants.allLit;
  let twilightCelebrated = lanterns.lanterns.length > 0 && lanterns.allLit;
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
    try {
      localStorage.setItem('glowbelow.muted', muted ? '1' : '0');
    } catch { /* storage unavailable: the choice just won't persist */ }
  };
  if (muted) {
    synth.setMuted(true);
    hud.setMuted(true);
  }
  hud.mute.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMute();
  });
  hud.album.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === 'play' && !parent.open) album.toggle();
  });
  // A world that already unlocked dash (a saved game, from iteration 3) shows it from the start.
  if (worldState.dashUnlocked) hud.showDash(false);
  hud.dash.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    input.dash(e.pointerType === 'mouse' ? input.last : 'touch');
  });
  hud.glow.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    input.glow(e.pointerType === 'mouse' ? input.last : 'touch');
  });

  input.onKey = (code) => {
    if (code === 'KeyM') toggleMute();
    // B opens the album (A steers left).
    if (code === 'KeyB' && mode === 'play' && !parent.open) album.toggle();
    if (mode === 'title' && (code === 'Space' || code === 'Enter')) start('keyboard');
    if (DEBUG && code === 'KeyC') overlay.visible = !overlay.visible;
    if (DEBUG && code === 'KeyG') reach.visible = !reach.visible;
    if (DEBUG && code === 'KeyO') {
      overview = !overview;
      scene.fog = overview ? null : fog;
    }
    if (DEBUG && code === 'KeyL') {
      plants.plants.forEach((p, i) => setTimeout(() => touchPlant(p.id), i * 60));
      lanterns.lanterns.forEach((l, i) => setTimeout(() => touchLantern(l.id), i * 60));
    }
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

  function touchLantern(id: string) {
    if (lanterns.touch(id)) {
      synth.lantern();
      // The first lantern lit sends its stamp to the album.
      const l = lanterns.lanterns.find((q) => q.id === id);
      if (l) meetCreature('lantern-jelly', l);
      if (lanterns.allLit && !twilightCelebrated) celebrateTwilight();
    }
  }

  function celebrateTwilight() {
    twilightCelebrated = true;
    // A wave of light runs up and down Twilight from the squid.
    for (const l of lanterns.lanterns) lanterns.flashAfter(l.id, 1 + Math.abs(l.y - body.pos.y) / 18);
    setTimeout(() => synth.chord(), 900);
    if (brain.state === 'following') setTimeout(() => dumboView.happySpin(), 1200);
  }

  function joinFireflies(group: number) {
    const ev = swarm.join(group);
    if (!ev) return;
    worldState.join(fireflyGroupId(group));
    synth.fireflyChimes();
    // The first group found is the friend: it sends its sticker to the album.
    if (ev.first && worldState.find('firefly')) {
      const g = swarm.groups[group];
      setTimeout(() => hud.stickerFly(stage.toScreen(new THREE.Vector3(g.x, g.y, 0)), STICKER_FIREFLY), 500);
    }
  }

  function meetNautilus() {
    if (!nautilus || !worldState.find('nautilus')) return;
    synth.nautilus();
    nautilusView?.nodHead();
    const at = nautilus.pos;
    setTimeout(() => hud.stickerFly(stage.toScreen(new THREE.Vector3(at.x, at.y + 1, 0)), STICKER_NAUTILUS), 700);
  }

  function touchStarfish(id: string) {
    starfish.wave(id);
    if (!worldState.findStarfish(id)) return;
    synth.starfish();
    const star = starfish.stars.find((q) => q.id === id);
    if (star) meetCreature('starfish', star);
    // The last one in its zone: a wave of light across that zone's starfish and a chord.
    const zoneIds = star ? starfish.idsIn(star.zone) : [];
    if (zoneIds.length > 0 && worldState.starfishCount(zoneIds) === zoneIds.length) {
      zoneIds.forEach((sid, i) => starfish.flashAfter(sid, 0.6 + i * 0.18));
      setTimeout(() => synth.chord(), 700);
    }
  }

  /** The first meeting with a sea creature: its stamp pops up and flies to the album. */
  function meetCreature(name: CreatureName, at: { x: number; y: number }) {
    if (!worldState.find(name)) return;
    const from = stage.toScreen(new THREE.Vector3(at.x, at.y + 0.6, 0));
    setTimeout(() => hud.stickerFly(from, stampArt(name)), 500);
  }

  function discoverDumbo() {
    if (!brain.discover()) return;
    worldState.find('dumbo');
    synth.flute();
    dumboView.happySpin();
    setTimeout(() => {
      const at = stage.toScreen(new THREE.Vector3(brain.pos.x, brain.pos.y + 0.6, 0));
      hud.stickerFly(at, STICKER_DUMBO);
    }, 700);
  }

  // Everything a glow pulse can reach, in one list: plants, the cave (and,
  // as they arrive, lanterns and friends). Friends that point at unlit
  // things use the same list.
  const glowTargets: GlowTarget[] = [
    ...built.plants.map((p): GlowTarget => ({ id: p.id, kind: 'plant', x: p.x, y: p.y + 0.8, r: 0.5 })),
    { id: 'cave', kind: 'cave', x: cave.x, y: cave.y, r: cave.r },
    ...(level.lanterns ?? []).map((l, i): GlowTarget => ({ id: lanternId(i), kind: 'lantern', x: l.x, y: l.y + 0.25, r: 0.6 })),
    ...swarm.groups.map((g, i): GlowTarget => ({ id: fireflyGroupId(i), kind: 'firefly', x: g.x, y: g.y, r: TUNING.firefly.groupRadius })),
    ...(level.starfish ?? []).map((st, i): GlowTarget => ({ id: starIds[i], kind: 'starfish', x: st.x, y: st.y, r: 0.6 })),
  ];
  const fireflyGroupOf = new Map(swarm.groups.map((_g, i) => [fireflyGroupId(i), i]));
  const glowById = new Map(glowTargets.map((t) => [t.id, t]));
  const unlitThings = () =>
    glowTargets.filter((t) => LIGHTABLE.includes(t.kind)).map((t) => ({ id: t.id, x: t.x, y: t.y, lit: worldState.isLit(t.id) }));

  // ------------------------------------------------------------ logic (60 Hz)
  function logic(dt: number) {
    logicSteps++;
    saver.tick(dt);
    if (mode !== 'play' || paused || overlayOpen) {
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

    // The optional dash: a burst along the steering (or facing), then steering eases back.
    dash.update(dt);
    // Crossing into another zone is saved, so a continued game starts there.
    const zoneHere = zoneAt(gameWorld.map, body.pos);
    if (zoneHere && zoneHere !== zoneNow) {
      zoneNow = zoneHere;
      saver.request();
    }
    // Dash unlocks the first time the squid reaches Twilight, and stays.
    if (!worldState.dashUnlocked && zoneHere === 'twilight' && worldState.unlockDash()) hud.showDash(true);
    if (ev.dash && worldState.dashUnlocked && !bump.locked && dash.trigger(body, dashDirection(body, steerIn, squidView.facing))) hud.dashFlash();
    steer(body, steerIn, dt, dash.params());
    const contact = collide(body, TUNING.squid.radius, built.world, dt);
    shaftPush(body, level.shaft, dt);
    for (const e of rings.update(dt, body)) {
      if (e.kind === 'ring') synth.ringNote(e.step);
      else synth.flourish();
    }
    if (jelly) {
      jelly.update(dt);
      // Touching the phantom jelly spills a few stars that float nearby, ready to catch again.
      const at = jelly.touch(body, TUNING.squid.radius, contact !== null, dt);
      if (at) {
        // The squid bounced off: a brief pause in steering lets the bounce show.
        bump.lockBriefly();
        synth.jellyBoing();
        jellyView?.flash();
        meetCreature('phantom-jelly', jelly.pos);
        const n = meter.spill(TUNING.jelly.spill);
        if (n > 0) {
          field.spill(at, n);
          synth.spill();
        }
      }
    }
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
        // A glow in Twilight calls the nautilus (once it has been found).
        if (nautilus && zoneAt(gameWorld.map, body.pos) === 'twilight' && nautilus.call(body.pos.y)) {
          synth.nautilus(true);
          nautilusView?.nodHead();
        }
      }
    }
    pulses.update(dt);
    for (const id of pulses.sweep(glowTargets)) {
      const kind = glowById.get(id)?.kind;
      if (kind === 'cave') discoverDumbo();
      else if (kind === 'plant') touchPlant(id);
      else if (kind === 'lantern') touchLantern(id);
      else if (kind === 'firefly') joinFireflies(fireflyGroupOf.get(id) ?? -1);
      else if (kind === 'starfish') touchStarfish(id);
    }

    const dumboEvent = brain.update(
      dt,
      { pos: body.pos, vel: body.vel, facing: squidView.facing },
      unlitThings(),
      brain.state === 'following' ? field.drifting() : [],
    );
    swarm.update(dt, { pos: body.pos, vel: body.vel, facing: squidView.facing }, unlitThings());
    for (const e of nautilus?.update(dt, body.pos, TUNING.squid.radius) ?? []) {
      if (e.kind === 'shed') field.shed(e.at, e.drift);
      else if (e.kind === 'met') meetNautilus();
    }

    if (dumboEvent?.kind === 'point') synth.flute();
    if (dumboEvent?.kind === 'spin') dumboView.happySpin();
    if (dumboEvent?.kind === 'gather') {
      // Dumbo's sparkle counts exactly like one the squid caught.
      const at = field.collect(dumboEvent.index);
      if (at) {
        meter.add();
        synth.dumboNote();
        dumboView.hop();
        sparkles.fly(at, body.pos);
      }
    }

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
    const plantsLit = plants.litCount / plants.plants.length;
    const lanternsLit = lanterns.lanterns.length > 0 ? lanterns.litCount / lanterns.lanterns.length : 0;
    // How much the squid is in Twilight: lighting, water and sound follow its zone.
    const tw = twilightness(homeTop, body.pos.y);
    const lit = plantsLit + (lanternsLit - plantsLit) * tw;
    lights.begin();
    lights.add(body.pos.x, body.pos.y, 1.2, 2.8, SQUID_LIGHT, 0.2 + 0.4 * meter.value, 0, true);
    plants.update(frameDt, lights);
    lanterns.update(frameDt, lights);
    fireflyView.update(frameDt, lights);
    starfish.update(frameDt, lights);
    effects.update(frameDt, stage.camera, pulses.active, lights);
    lights.end(0.24 + 0.46 * lit + 0.06 * tw, rig.view());
    const wc = brighten(moodColor(moodStops, stage.camera.position.y), lanternsLit * twilightness(homeTop, stage.camera.position.y));
    water.setRGB(wc[0], wc[1], wc[2], THREE.SRGBColorSpace);
    fog.color.copy(water);

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
    if (jelly && jellyView) jellyView.update(frameDt, jelly);
    if (nautilus && nautilusView) nautilusView.update(frameDt, nautilus);
    ringsView.update(frameDt);
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
    hud.setDash(dash.readiness);
    hud.setHints(play && hints.moveVisible, play && hints.glowVisible, hints.icons, squidScreen);
    synth.setBrightness(lit);
    synth.setZone(tw);

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
    parent.update(frameDt);
    render(paused ? 0 : frameDt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // Expose for manual testing in the console.
  if (DEBUG) Object.assign(window, { game: { body, meter, plants, brain, field, stage, pulses, hints, synth, rig, zone, gameWorld, worldSeed, genMs, jelly, worldState, swarm, nautilus, dash, saver, parent, album, rings, starfish } });
}

boot().catch((err) => {
  console.error(err);
  container.textContent = '';
});

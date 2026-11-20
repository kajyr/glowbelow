import * as THREE from 'three';
import { Synth } from './audio/synth';
import { FactPlayer } from './audio/facts';
import { BumpState } from './game/bump';
import { Dash, dashDirection } from './game/dash';
import { collide } from './game/collision';
import { DumboBrain, dumboTargets } from './game/dumboBrain';
import { GlowMeter } from './game/glowMeter';
import { brighten, mix, moodColor, reefness, twilightness, WHALE_FALL_WATER, whaleFallness, worldMood } from './game/mood';
import { LIGHTABLE, type GlowTarget } from './game/glowTargets';
import { Jelly } from './game/jelly';
import { Hints, type InputKind } from './game/hints';
import { PulseSystem } from './game/pulse';
import { shaftPush, surfacePush, type Gate } from './game/shaft';
import { CoralTouch, coralId } from './game/corals';
import { CORAL_COLOURS, COLOUR_HEX, GLOW_BRIGHT, type CoralColour, type GlowColour } from './game/colours';
import { ColourGame, Cuttlefish, pickColour } from './game/cuttlefish';
import { makeRng } from './game/rng';
import { SparkleField } from './game/sparkleField';
import { steer, type Body, type SteerInput } from './game/steering';
import { fireflyGroupId, Swarm } from './game/swarm';
import { Nautilus } from './game/nautilus';
import { BubbleRings } from './game/bubbleRings';
import { GiantSquid } from './game/giantSquid';
import { ribOrder, WhaleSong } from './game/ribs';
import type { Vec2 } from './game/vec';
import { TUNING } from './game/tuning';
import { WorldState, type CreatureName, type StampName } from './game/worldState';
import { browserStorage, clearSave, loadSave, Saver, saveUnavailableHere } from './game/save';
import { loadVolumes, saveVolumes } from './game/settings';
import { ParentCorner } from './ui/parentCorner';
import { Album, stampArt } from './ui/album';
import { Input } from './input';
import { generateWorld, ridePath } from './levels/assembleWorld';
import { whaleFallSpots } from './levels/whaleFall';
import { SPINE_Y } from './levels/skeleton';
import { JellyFreeArea } from './levels/jellyArea';
import { buildLevel, sparkleBounds } from './levels/level';
import { placedCircles } from './levels/pieces';
import { coralTop } from './levels/sunlitReef';
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
import { ribId, starfishIds } from './levels/ids';
import { SkeletonView } from './render/skeletonView';
import { GiantSquidView } from './render/giantSquidView';
import { FishView } from './render/fishView';
import { CoralsView } from './render/coralsView';
import { ReefView } from './render/reefView';
import { CuttlefishView } from './render/cuttlefishView';
import { zoneAt } from './levels/world';
import { Hud } from './ui/hud';
import { STICKER_DUMBO, STICKER_FIREFLY, STICKER_NAUTILUS } from './ui/icons';
import { JellyView } from './render/jellyView';
import { registerOffline } from './pwa';

const STEP = 1 / 60;
/** The squid's own light: its glow colour (see `wearGlow`). */
const SQUID_LIGHT = new THREE.Color('#5dcaa5');

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

const container = document.getElementById('game') as HTMLElement;

registerOffline();

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
  if (DEBUG) console.info(`[world] seed ${worldSeed} (home from ${zone.seed}, ${zone.attempts} tries; twilight ${gameWorld.twilight.attempts} tries; whale fall ${gameWorld.whaleFall.attempts} tries), generated in ${genMs.toFixed(1)} ms`);
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
  // Whale fall: the skeleton and its ribs, the giant squid behind the skull, small fish.
  const skeleton = level.skeleton;
  if (!skeleton) throw new Error('the world has no whale fall');
  const wfSpots = whaleFallSpots(skeleton);
  const ribIds = wfSpots.ribs.map((_r, i) => ribId(i));
  const skeletonView = new SkeletonView(models, skeleton, ribIds, wfSpots.ribs, lights, worldState);
  scene.add(skeletonView.root);
  const whaleSong = new WhaleSong(wfSpots.ribs.map((r) => r.x), skeleton.y + SPINE_Y + TUNING.whaleFall.bandAbove, skeletonView.allLit);
  // The way up is searched once, when first needed (it covers the whole world).
  let ride: Vec2[] | null = null;
  const getRide = () => (ride ??= ridePath(gameWorld));
  const giant = new GiantSquid(wfSpots, getRide);
  const giantView = new GiantSquidView(models);
  scene.add(giantView.root);
  const fishView = new FishView(models, level.fishSchools ?? []);
  scene.add(fishView.group);
  // The Sunlit reef: its coral garden (each coral's colour lives in the world state) and its light.
  const reefZone = gameWorld.map.zones.find((z) => z.name === 'sunlit-reef');
  if (!reefZone) throw new Error('the world has no sunlit reef');
  const reefRect = reefZone.rect;
  const coralSpots = level.corals ?? [];
  const coralIds = coralSpots.map((_c, i) => coralId(i));
  const coralIndex = new Map(coralIds.map((id, i) => [id, i]));
  const coralTouch = new CoralTouch(coralSpots.map((c, i) => ({ id: coralIds[i], circles: placedCircles(c), first: c.colour, top: coralTop(c) })));
  const coralsView = new CoralsView(models, coralSpots, (i) => worldState.coralColour(coralIds[i], coralSpots[i].colour), lights);
  scene.add(coralsView.group);
  const reefView = new ReefView(reefRect);
  scene.add(reefView.group);
  // Twilight's top passage lets the squid down from the reef, never up into it.
  const gate: Gate = { fromAbove: false };
  const surface = { x0: reefRect.minX, x1: reefRect.maxX, y: reefRect.maxY };
  // The cuttlefish, disguised as a coral in the garden. It shows colours of the corals near it.
  const hide = level.cuttlefish;
  if (!hide) throw new Error('the reef has no cuttlefish');
  const nearCorals = coralSpots.map((c, i) => ({ i, d: Math.abs(c.x - hide.x) })).filter((n) => n.d < TUNING.cuttlefish.nearby);
  const nearbyColours = () => nearCorals.map(({ i }) => worldState.coralColour(coralIds[i], coralSpots[i].colour));
  const choiceRng = makeRng((worldSeed ^ 0x3c7a11e5) >>> 0);
  const colourGame = new ColourGame((prev) => pickColour(nearbyColours(), (c) => worldState.isUnlocked(c), prev, choiceRng));
  const cuttlefish = new Cuttlefish({ x: hide.x, y: hide.y }, colourGame, choiceRng);
  // Its disguise wears its neighbours' colour and flickers one that matches neither.
  const neighbours = [...nearCorals].sort((a, b) => a.d - b.d).slice(0, 2).map(({ i }) => coralSpots[i].colour);
  const disguise = { base: neighbours[0] ?? 'pink', odd: CORAL_COLOURS.find((c) => !neighbours.includes(c))! };
  const cuttlefishView = new CuttlefishView(models, hide, disguise, lights);
  scene.add(cuttlefishView.root, cuttlefishView.disguise);
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
  const homeTop = gameWorld.map.zones.find((z) => z.name === 'twilight')!.rect.minY;
  const homeLeft = gameWorld.map.zones.find((z) => z.name === 'home')!.rect.minX;
  const reefFloor = reefRect.minY;
  const moodStops = worldMood(homeTop, reefFloor, reefRect.maxY);
  const water = new THREE.Color();
  scene.background = water;
  let overview = false;
  const rig = new CameraRig(stage, level.cameraBounds);

  // ------------------------------------------------------------ state
  // A continued game starts at the entry of the zone it was left in.
  const entry = (saved && gameWorld.entries[saved.zone]) || level.start;
  const body: Body = { pos: { ...entry }, vel: { x: 0, y: 0 } };
  // Friends already found come back with the squid.
  if (worldState.hasFound('dumbo')) brain.restore({ x: entry.x - 1.8, y: entry.y + 0.5 });
  if (nautilus && worldState.hasFound('nautilus')) nautilus.found = true;
  if (worldState.hasFound('cuttlefish')) cuttlefish.restore();
  if (worldState.hasFound('giant-squid')) {
    giant.restore();
    // Find the way up while the title shows, not in the middle of play.
    setTimeout(getRide, 300);
  }
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
  const facts = new FactPlayer();
  facts.volume = volumes.effects;
  // Play pauses while the album or the parent corner is open.
  let overlayOpen = false;
  const overlayChanged = () => {
    overlayOpen = album.open || parent.open;
    if (!album.open) facts.stop();
    synth.setDucked(overlayOpen);
    input.reset();
  };
  const parent = new ParentCorner(container, volumes, {
    onVolumes: (v) => {
      synth.setVolumes(v.music, v.effects);
      facts.volume = v.effects;
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
    'giant-squid': () => synth.giantSquid(),
    cuttlefish: () => synth.cuttlefish(),
  };
  const album = new Album(container, worldState, {
    onStampSound: (s) => stampSounds[s]?.(),
    // Silent while muted; closing the album stops it (see overlayChanged).
    onFact: (s) => !muted && facts.play(s),
    onOpenChange: overlayChanged,
    onBadge: (show) => hud.setBadge(show),
    onChooseGlow: (c) => {
      if (worldState.chooseGlow(c)) wearGlow(c);
    },
  }, [
    { zone: 'home', tint: '#0b2150', ids: starfish.idsIn('home') },
    { zone: 'twilight', tint: '#3b3f8f', ids: starfish.idsIn('twilight') },
    { zone: 'whale-fall', tint: '#1f4a73', ids: starfish.idsIn('whale-fall') },
    { zone: 'sunlit-reef', tint: '#2f9cc4', ids: starfish.idsIn('sunlit-reef') },
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
    if (muted) facts.stop();
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
      ribIds.forEach((id, i) => setTimeout(() => touchRib(id), i * 120));
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

  /** A rib reached by a glow: its note (rising from the tail), and it stays lit. */
  function touchRib(id: string) {
    synth.ribNote(ribIds.indexOf(id));
    if (skeletonView.touch(id) && whaleSong.lit(skeletonView.litCount)) setTimeout(singWhaleSong, 700);
  }

  /** The whale song: the skeleton glows, sparkles burst out of it, and the glow meter fills. */
  function singWhaleSong() {
    synth.whaleSong();
    skeletonView.sing();
    wfSpots.ribs.forEach((r, i) => setTimeout(() => sparkles.cloud(r.x, r.y, 10), 200 + i * 160));
    setTimeout(() => {
      while (!meter.full) meter.add();
      hud.glowFlash();
    }, 1400);
    if (brain.state === 'following') setTimeout(() => dumboView.happySpin(), 1800);
  }

  function wakeGiant() {
    synth.giantSquid();
    if (worldState.find('giant-squid')) {
      const at = giant.pos;
      setTimeout(() => hud.stickerFly(stage.toScreen(new THREE.Vector3(at.x, at.y + 2, 0)), stampArt('giant-squid')), 2200);
    }
    // Find the way up while it rises (a calm moment), before the first ride.
    setTimeout(getRide, 1500);
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

  /**
   * A coral touched or reached by a glow: it steps to its next colour and
   * chimes. In the cuttlefish's game, a touched coral is judged by its colour
   * before the touch: the right one flashes and keeps its colour.
   */
  function touchCoral(id: string, chime = true, touched = false) {
    const i = coralIndex.get(id);
    if (i === undefined) return;
    if (touched && cuttlefish.state === 'playing') {
      const ev = colourGame.touch(worldState.coralColour(id, coralSpots[i].colour));
      if (ev?.kind === 'right') {
        coralsView.flash(i);
        cuttlefishView.cheerUp();
        synth.flourish();
        return;
      }
      if (ev?.kind === 'wrong') {
        cuttlefishView.wiggleNo();
        synth.wiggle();
      }
    }
    const colour = worldState.stepCoral(id, coralSpots[i].colour);
    coralsView.setColour(i, colour);
    if (chime) synth.coral(CORAL_COLOURS.indexOf(colour));
  }

  /** A glow found the cuttlefish: it swims out, plays its sound, and its sticker flies to the album. */
  function revealCuttlefish() {
    if (!cuttlefish.pulse()) return;
    synth.cuttlefish();
    sparkles.cloud(hide!.x, hide!.y + 0.8, 8);
    if (worldState.find('cuttlefish')) {
      setTimeout(() => hud.stickerFly(stage.toScreen(new THREE.Vector3(cuttlefish.pos.x, cuttlefish.pos.y + 1, 0)), stampArt('cuttlefish')), 1400);
    }
  }

  /** The colour game's events: a new colour to find, and the prize at the end. */
  function colourGameEvent(ev: ReturnType<ColourGame['update']>) {
    if (!ev) return;
    if (ev.kind === 'show') {
      cuttlefishView.setShow(ev.colour);
      synth.colourCall(CORAL_COLOURS.indexOf(ev.colour));
    } else if (ev.kind === 'finish') {
      cuttlefishView.setShow(null);
      winColour(ev.colour);
    }
  }

  /** Finishing the colour game paints the squid's glow in the last colour shown, and unlocks it for good. */
  function winColour(colour: CoralColour) {
    worldState.unlockColour(colour);
    worldState.chooseGlow(colour);
    wearGlow(colour);
    synth.chord();
    squidView.pulse(true);
    sparkles.cloud(body.pos.x, body.pos.y, 12);
    hud.glowFlash();
  }

  /** The squid's glow in a colour: its tips, its light, the pulse ring and the glow button. */
  function wearGlow(colour: GlowColour) {
    squidView.setGlowColour(new THREE.Color(COLOUR_HEX[colour]));
    SQUID_LIGHT.set(COLOUR_HEX[colour]);
    effects.setGlowColour(new THREE.Color(GLOW_BRIGHT[colour]));
    hud.setGlowColour(GLOW_BRIGHT[colour]);
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
    ...wfSpots.ribs.map((r, i): GlowTarget => ({ id: ribIds[i], kind: 'rib', x: r.x, y: r.y, r: r.r })),
    ...coralSpots.map((c, i): GlowTarget => ({ id: coralIds[i], kind: 'coral', ...coralTop(c), r: 0.5 })),
    { id: 'cuttlefish', kind: 'cuttlefish', x: hide.x, y: hide.y + 0.7, r: 0.7 },
  ];
  // The giant squid moves once awake; its target follows it (see logic).
  const giantTarget: GlowTarget = { id: 'giant-squid', kind: 'giant', x: giant.pos.x, y: giant.pos.y, r: 3 };
  glowTargets.push(giantTarget);
  const fireflyGroupOf = new Map(swarm.groups.map((_g, i) => [fireflyGroupId(i), i]));
  const glowById = new Map(glowTargets.map((t) => [t.id, t]));
  // A continued game wears the glow colour it chose.
  wearGlow(worldState.glowColour);
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
    // The giant squid: while it carries the squid, the squid just sits on its arm.
    const giantEvent = giant.update(dt, body.pos, steering);
    giantTarget.x = giant.pos.x;
    giantTarget.y = giant.pos.y;
    if (giantEvent?.kind === 'board') synth.flourish();
    if (giantEvent?.kind === 'drop') setTimeout(() => synth.chord(), 300);
    let contact: ReturnType<typeof collide> = null;
    if (giant.riding) {
      const seat = giant.armTip;
      if (giantEvent?.kind !== 'board') {
        body.vel.x = (seat.x - body.pos.x) / dt;
        body.vel.y = (seat.y - body.pos.y) / dt;
      } else body.vel.x = body.vel.y = 0;
      body.pos.x = seat.x;
      body.pos.y = seat.y;
    } else {
      if (ev.dash && worldState.dashUnlocked && !bump.locked && dash.trigger(body, dashDirection(body, steerIn, squidView.facing))) hud.dashFlash();
      steer(body, steerIn, dt, dash.params());
      contact = collide(body, TUNING.squid.radius, built.world, dt);
      shaftPush(body, level.shaft, dt, gate);
      surfacePush(body, surface, dt);
    }
    // Corals: swimming into one steps it to its next colour.
    for (const id of coralTouch.update(body.pos, TUNING.squid.radius)) touchCoral(id, true, true);
    // The cuttlefish: touching it starts its colour game.
    if (cuttlefish.update(dt, body.pos)?.kind === 'start') {
      const first = colourGame.start();
      if (first) colourGameEvent(first);
      else cuttlefish.state = 'idle';
    }
    colourGameEvent(colourGame.update(dt));
    // Sunglasses in the bright reef.
    squidView.setSunglasses(zoneHere === 'sunlit-reef');
    // Swimming along the lit ribs from tail to head sings the whale song again.
    if (whaleSong.update(dt, body.pos, skeletonView.allLit)) singWhaleSong();
    for (const e of rings.update(dt, body)) {
      if (e.kind === 'ring') synth.ringNote(e.step);
      else synth.flourish();
    }
    if (jelly) {
      jelly.update(dt);
    }
    if (jelly && !giant.riding) {
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
    const ribsReached: GlowTarget[] = [];
    const coralsReached: string[] = [];
    for (const { id, kind: pulseKind } of pulses.sweepHits(glowTargets)) {
      const kind = glowById.get(id)?.kind;
      if (kind === 'cave') discoverDumbo();
      else if (kind === 'plant') touchPlant(id);
      else if (kind === 'lantern') touchLantern(id);
      else if (kind === 'firefly') joinFireflies(fireflyGroupOf.get(id) ?? -1);
      else if (kind === 'starfish') touchStarfish(id);
      else if (kind === 'rib') ribsReached.push(glowById.get(id)!);
      else if (kind === 'coral') coralsReached.push(id);
      else if (kind === 'cuttlefish') revealCuttlefish();
      else if (kind === 'giant') {
        const e = giant.pulse(pulseKind);
        if (e?.kind === 'stir') synth.giantStir();
        if (e?.kind === 'wake') wakeGiant();
      }
    }
    // Several ribs reached at once ring nearest first, in a quick run.
    ribOrder(ribsReached, body.pos).forEach((id, i) => (i === 0 ? touchRib(id) : setTimeout(() => touchRib(id), i * 90)));
    // Corals reached by a glow all change at once; one chime for the lot.
    coralsReached.forEach((id, i) => touchCoral(id, i === 0));

    const dumboEvent = brain.update(
      dt,
      { pos: body.pos, vel: body.vel, facing: squidView.facing },
      // In Whale fall: the ribs, then the sleeping giant squid (the way up).
      dumboTargets(zoneHere, unlitThings(), { x: giant.pos.x, y: giant.pos.y, awake: giant.state !== 'asleep' }),
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
    const wf = whaleFallness(homeLeft, body.pos.x);
    const ribsLit = skeletonView.litCount / skeletonView.ribs.length;
    const homeOrTwilight = plantsLit + (lanternsLit - plantsLit) * tw;
    const rf = reefness(reefFloor, body.pos.y);
    // The reef is always bright: nothing there needs lighting up.
    const lit = homeOrTwilight + (ribsLit - homeOrTwilight) * wf + (1 - homeOrTwilight) * rf;
    lights.begin();
    lights.add(body.pos.x, body.pos.y, 1.2, 2.8, SQUID_LIGHT, 0.2 + 0.4 * meter.value, 0, true);
    plants.update(frameDt, lights);
    lanterns.update(frameDt, lights);
    fireflyView.update(frameDt, lights);
    starfish.update(frameDt, lights);
    skeletonView.update(frameDt, lights);
    giantView.update(frameDt, giant, body.pos, lights);
    effects.update(frameDt, stage.camera, pulses.active, lights);
    reefView.update(frameDt, lights);
    lights.end(0.24 + 0.46 * lit + 0.06 * tw + 0.3 * rf, rig.view());
    const camWf = whaleFallness(homeLeft, stage.camera.position.x);
    const camRf = reefness(reefFloor, stage.camera.position.y);
    const wc = mix(brighten(moodColor(moodStops, stage.camera.position.y), lanternsLit * twilightness(homeTop, stage.camera.position.y) * (1 - camRf)), brighten(WHALE_FALL_WATER, ribsLit * 0.45), camWf);
    stage.setBrightWater(camRf);
    effects.brightWater = camRf > 0.5;
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
    fishView.update(frameDt);
    coralsView.update(frameDt);
    cuttlefishView.update(frameDt, cuttlefish);
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
    synth.setWhaleFall(wf);
    synth.setReef(rf);

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
  if (DEBUG) Object.assign(window, { game: { body, meter, plants, brain, field, stage, pulses, hints, synth, rig, zone, gameWorld, worldSeed, genMs, jelly, worldState, swarm, nautilus, dash, saver, parent, album, rings, starfish, giant, skeletonView, whaleSong, coralsView, cuttlefish, colourGame } });
}

boot().catch((err) => {
  console.error(err);
  container.textContent = '';
});

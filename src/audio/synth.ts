/**
 * All game sound, synthesised with Web Audio: no sound files. The context is
 * created on the first interaction (the title-screen tap), never before.
 * Everything goes through one master gain that the mute control sets to 0;
 * muting also suspends the context, and so does the game going off screen
 * (an app in the background must be silent). A compressor keeps peaks soft.
 */

/** The audio context runs only while sound is on and the game is on screen. */
export function contextRuns(s: { muted: boolean; hidden: boolean }): boolean {
  return !s.muted && !s.hidden;
}

// C major pentatonic over two octaves: any sequence sounds pleasant.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0];

export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  /** The last node before the speakers (the compressor). */
  private out: AudioNode | null = null;
  private padExtra: GainNode | null = null;
  private padTwilight: GainNode | null = null;
  private padWhale: GainNode | null = null;
  private padReef: GainNode | null = null;
  private reef = 0;
  private twilight = 0;
  /** The pad (music) and every other sound (effects) have their own volume. */
  private music: GainNode | null = null;
  private effects: GainNode | null = null;
  private volume = { music: 1, effects: 1 };
  private noise: AudioBuffer | null = null;
  private muted = false;
  private hidden = false;
  private noteIndex = 3;
  private noteDir = 1;
  private lastNote = 0;

  private get runs(): boolean {
    return contextRuns({ muted: this.muted, hidden: this.hidden });
  }

  get started(): boolean {
    return this.ctx !== null;
  }

  /** For checks in the console: context state and master level. */
  get state(): { context: string; master: number } {
    return { context: this.ctx?.state ?? 'none', master: this.master?.gain.value ?? 0 };
  }

  /** Must be called inside a user gesture. */
  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    comp.connect(ctx.destination);
    this.out = comp;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(comp);
    this.music = ctx.createGain();
    this.music.gain.value = this.volume.music;
    this.music.connect(this.master);
    this.effects = ctx.createGain();
    this.effects.gain.value = this.volume.effects;
    this.effects.connect(this.master);

    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    void ctx.resume();
    this.startPad();
    if (!this.runs) void ctx.suspend();
  }

  /** Debug (the store video): the game's sound as a stream, still playing on the speakers too. */
  captureStream(): MediaStream | null {
    if (!this.ctx || !this.out) return null;
    const dest = this.ctx.createMediaStreamDestination();
    this.out.connect(dest);
    return dest.stream;
  }

  /** Music (the pad) and effects volume, each 0 → 1. */
  setVolumes(music: number, effects: number): void {
    this.volume = { music, effects };
    if (!this.ctx || !this.music || !this.effects) return;
    const now = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(music, now, 0.05);
    this.effects.gain.setTargetAtTime(effects, now, 0.05);
  }

  /** Music fades down while an overlay (album, parent corner) is open. */
  setDucked(ducked: boolean): void {
    if (!this.ctx || !this.music) return;
    this.music.gain.setTargetAtTime(this.volume.music * (ducked ? 0.35 : 1), this.ctx.currentTime, 0.3);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : 0.8, now, 0.03);
    if (muted) setTimeout(() => this.muted && this.ctx?.suspend(), 150);
    else if (this.runs) void this.ctx.resume();
  }

  /** Off screen (another app, screen locked, tab hidden): silent until it comes back. */
  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    if (!this.ctx) return;
    if (this.runs) void this.ctx.resume();
    else void this.ctx.suspend();
  }

  private live(): AudioContext | null {
    return this.ctx && !this.muted ? this.ctx : null;
  }

  /** Envelope helper: a gain node that rises softly and decays. */
  private env(at: number, peak: number, attack: number, decay: number): GainNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    g.connect(this.effects!);
    return g;
  }

  private tone(freq: number, type: OscillatorType, at: number, peak: number, attack: number, decay: number, out?: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.env(at, peak, attack, decay);
    if (out) {
      g.disconnect();
      g.connect(out);
    }
    o.connect(g);
    o.start(at);
    o.stop(at + attack + decay + 0.05);
    return o;
  }

  /** A short soft note; notes in quick succession walk up and down the scale. */
  sparkle(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastNote > 1.5) {
      this.noteIndex = Math.floor(Math.random() * 4);
      this.noteDir = 1;
    } else {
      this.noteIndex += this.noteDir;
      if (this.noteIndex >= PENTA.length - 1 || this.noteIndex <= 0) this.noteDir *= -1;
    }
    this.lastNote = now;
    const f = PENTA[this.noteIndex];
    this.tone(f, 'sine', now, 0.13, 0.008, 0.55);
    this.tone(f * 2, 'triangle', now, 0.025, 0.005, 0.25);
  }

  /** Gentle "whoom" with a light sparkle; the big one is fuller and deeper. */
  whoom(big: boolean): void {
    const ctx = this.live();
    if (!ctx || !this.noise) return;
    const now = ctx.currentTime;
    const dur = big ? 1.6 : 0.8;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(big ? 140 : 220, now);
    bp.frequency.exponentialRampToValueAtTime(big ? 900 : 1100, now + dur * 0.35);
    bp.frequency.exponentialRampToValueAtTime(big ? 200 : 300, now + dur);
    src.connect(bp);
    bp.connect(this.env(now, big ? 0.32 : 0.18, dur * 0.25, dur * 0.75));
    src.start(now);
    src.stop(now + dur + 0.1);

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(big ? 65 : 110, now);
    o.frequency.exponentialRampToValueAtTime(big ? 130 : 200, now + dur * 0.4);
    o.connect(this.env(now, big ? 0.3 : 0.14, dur * 0.2, dur * 0.8));
    o.start(now);
    o.stop(now + dur + 0.1);

    // Sparkle on top.
    const notes = big ? [6, 7, 8, 9] : [7, 9];
    notes.forEach((n, i) => this.tone(PENTA[n] * 2, 'sine', now + 0.12 + i * 0.07, 0.03, 0.005, 0.4));
  }

  /** Soft chime when a plant blooms. */
  bloom(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const f = PENTA[2 + Math.floor(Math.random() * 5)];
    this.tone(f, 'sine', now, 0.09, 0.01, 1.3);
    this.tone(f * 1.5, 'sine', now + 0.06, 0.05, 0.01, 1.1);
    this.tone(f * 3.01, 'sine', now, 0.015, 0.005, 0.6);
  }

  /** Soft comic boing for a bump. */
  boing(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(320, now);
    o.frequency.exponentialRampToValueAtTime(140, now + 0.35);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 18;
    const depth = ctx.createGain();
    depth.gain.value = 25;
    lfo.connect(depth);
    depth.connect(o.frequency);
    o.connect(this.env(now, 0.12, 0.01, 0.4));
    o.start(now);
    lfo.start(now);
    o.stop(now + 0.5);
    lfo.stop(now + 0.5);
  }

  /** Celebration when the last plant is lit. */
  chord(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    [261.63, 329.63, 392.0, 523.25, 659.25, 783.99].forEach((f, i) => {
      this.tone(f, 'triangle', now + i * 0.09, 0.06, 0.05, 2.6);
      this.tone(f * 2, 'sine', now + i * 0.09, 0.02, 0.02, 1.8);
    });
  }

  /** A jellyfish lantern lighting up: a warm, round bell note with a soft shimmer. */
  lantern(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const f = PENTA[Math.floor(Math.random() * 5)] / 2;
    this.tone(f, 'sine', now, 0.1, 0.02, 1.6);
    this.tone(f * 2, 'triangle', now + 0.03, 0.03, 0.02, 1.0);
    this.tone(f * 3, 'sine', now + 0.06, 0.02, 0.01, 0.7);
  }

  /** A bubble ring popping: a soft whoosh and the `step`-th note up the scale (a chain plays a rising run). */
  ringNote(step: number): void {
    const ctx = this.live();
    if (!ctx || !this.noise) return;
    const now = ctx.currentTime;
    const f = PENTA[step % 5] * 2 ** Math.floor(step / 5);
    this.tone(f, 'sine', now, 0.07, 0.01, 0.5);
    this.tone(f * 2, 'triangle', now + 0.02, 0.015, 0.01, 0.25);
    const air = ctx.createBufferSource();
    air.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(900, now);
    bp.frequency.exponentialRampToValueAtTime(2600, now + 0.25);
    air.connect(bp);
    bp.connect(this.env(now, 0.025, 0.02, 0.25));
    air.start(now);
    air.stop(now + 0.35);
  }

  /** A coral changing colour: a soft glassy chime, its pitch set by the new colour (0 … 4). */
  coral(colour: number): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const f = PENTA[5 + (colour % 5)];
    this.tone(f, 'sine', now, 0.05, 0.005, 0.7);
    this.tone(f * 3, 'sine', now, 0.012, 0.005, 0.35);
  }

  /** A rubber stamp thumping onto the album page: a soft low knock with a papery slap. */
  stampThump(): void {
    const ctx = this.live();
    if (!ctx || !this.noise) return;
    const now = ctx.currentTime;
    const o = this.tone(140, 'sine', now, 0.22, 0.004, 0.18);
    o.frequency.setValueAtTime(180, now);
    o.frequency.exponentialRampToValueAtTime(70, now + 0.15);
    const slap = ctx.createBufferSource();
    slap.buffer = this.noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    slap.connect(lp);
    lp.connect(this.env(now, 0.08, 0.002, 0.09));
    slap.start(now);
    slap.stop(now + 0.15);
  }

  /** The cuttlefish: three bubbly blips that bend upward, a playful hello. */
  cuttlefish(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    [392.0, 523.25, 659.25].forEach((f, i) => {
      const o = this.tone(f, 'sine', now + i * 0.11, 0.06, 0.01, 0.22);
      o.frequency.setValueAtTime(f * 0.8, now + i * 0.11);
      o.frequency.exponentialRampToValueAtTime(f * 1.15, now + i * 0.11 + 0.12);
    });
    this.tone(1046.5, 'triangle', now + 0.36, 0.02, 0.01, 0.5);
  }

  /** The cuttlefish shows a colour to find: a soft two-note call, pitched by the colour (0 … 4). */
  colourCall(colour: number): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const f = PENTA[colour % 5];
    this.tone(f, 'triangle', now, 0.04, 0.01, 0.25);
    this.tone(f * 1.5, 'triangle', now + 0.14, 0.035, 0.01, 0.35);
  }

  /** Not that coral: a gentle little "uh-uh", never a buzzer. */
  wiggle(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(392.0, 'sine', now, 0.035, 0.01, 0.12);
    this.tone(349.23, 'sine', now + 0.14, 0.03, 0.01, 0.18);
  }

  /** Every ring of a chain in a row: a quick sparkly run up to a high note. */
  flourish(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime + 0.12;
    [5, 6, 7, 8, 9].forEach((k, i) => this.tone(PENTA[k], 'sine', now + i * 0.06, 0.04, 0.005, 0.4));
    this.tone(PENTA[9], 'triangle', now + 0.34, 0.03, 0.01, 0.9);
  }

  /**
   * A rib of the whale skeleton: a soft, woody xylophone note, `step` up the
   * scale from the tail (the ribs rise toward the head).
   */
  ribNote(step: number): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const f = PENTA[step % 5] * 2 ** Math.floor(step / 5) / 2;
    this.tone(f, 'triangle', now, 0.11, 0.004, 0.7);
    this.tone(f * 4, 'sine', now, 0.025, 0.002, 0.12);
    this.tone(f * 2, 'sine', now + 0.01, 0.03, 0.004, 0.4);
  }

  /**
   * The whale song: long, low notes that glide up and fall back like a
   * whale's call, with a soft chime of the rib notes over it.
   */
  whaleSong(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const calls: [number, number, number, number][] = [
      // start, from Hz, to Hz, length
      [0, 196, 293.66, 2.2],
      [1.9, 261.63, 220, 1.8],
      [3.4, 220, 329.63, 2.4],
    ];
    for (const [at, f0, f1, len] of calls) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f0, now + at);
      o.frequency.exponentialRampToValueAtTime(f1, now + at + len * 0.6);
      o.frequency.exponentialRampToValueAtTime(f1 * 0.92, now + at + len);
      const vib = ctx.createOscillator();
      vib.frequency.value = 4.5;
      const vd = ctx.createGain();
      vd.gain.value = 3;
      vib.connect(vd);
      vd.connect(o.frequency);
      o.connect(this.env(now + at, 0.13, len * 0.35, len * 0.65));
      o.start(now + at);
      vib.start(now + at);
      o.stop(now + at + len + 0.1);
      vib.stop(now + at + len + 0.1);
      // A soft octave above, for warmth.
      this.tone(f1 * 2, 'sine', now + at + len * 0.4, 0.02, len * 0.2, len * 0.5);
    }
    [0, 2, 4, 5, 7, 9].forEach((k, i) => this.tone(PENTA[k], 'sine', now + 0.4 + i * 0.55, 0.03, 0.01, 1.2));
  }

  /** The giant squid waking: a deep, slow, gentle rising hum. */
  giantSquid(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const [f, k] of [[55, 1], [82.41, 0.5], [110, 0.25]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, now);
      o.frequency.exponentialRampToValueAtTime(f * 1.5, now + 2.4);
      o.connect(this.env(now, 0.2 * k, 0.8, 2.6));
      o.start(now);
      o.stop(now + 3.6);
    }
    this.tone(PENTA[0], 'sine', now + 1.6, 0.04, 0.2, 1.6);
    this.tone(PENTA[2], 'sine', now + 2.0, 0.035, 0.2, 1.6);
  }

  /** The giant squid stirring in its sleep: a low, sleepy murmur. */
  giantStir(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(70, now);
    o.frequency.exponentialRampToValueAtTime(58, now + 1.1);
    o.connect(this.env(now, 0.12, 0.25, 1));
    o.start(now);
    o.stop(now + 1.4);
  }

  /** A starfish found: two soft, bright twinkles. */
  starfish(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(PENTA[7], 'sine', now, 0.05, 0.005, 0.35);
    this.tone(PENTA[9], 'sine', now + 0.11, 0.045, 0.005, 0.5);
  }

  /** A firefly group joining: a quick, giggly run of high chimes. */
  fireflyChimes(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const run = [0, 2, 1, 3, 2, 4];
    run.forEach((k, i) => {
      const at = now + i * 0.07 + Math.random() * 0.02;
      const f = PENTA[k] * 2;
      this.tone(f, 'sine', at, 0.05, 0.005, 0.35);
      this.tone(f * 2.01, 'triangle', at, 0.012, 0.005, 0.2);
    });
  }

  /** The nautilus: a deep, slow note gliding down, with a soft fifth above. Quieter when it answers a call. */
  nautilus(quiet = false): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const peak = quiet ? 0.07 : 0.14;
    for (const [f, k] of [[110, 1], [164.81, 0.35]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, now);
      o.frequency.exponentialRampToValueAtTime(f * 0.75, now + 1.8);
      o.connect(this.env(now, peak * k, 0.35, 2.2));
      o.start(now);
      o.stop(now + 2.8);
    }
  }

  /** The phantom jelly's soft, low boing: lower and slower than the bump boing. */
  jellyBoing(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(170, now);
    o.frequency.exponentialRampToValueAtTime(85, now + 0.6);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 7;
    const depth = ctx.createGain();
    depth.gain.value = 10;
    lfo.connect(depth);
    depth.connect(o.frequency);
    o.connect(this.env(now, 0.12, 0.03, 0.65));
    o.start(now);
    lfo.start(now);
    o.stop(now + 0.75);
    lfo.stop(now + 0.75);
  }

  /** Stars spilling out: a short, soft twinkle going down the scale. */
  spill(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    [7, 5, 3].forEach((n, i) => this.tone(PENTA[n], 'sine', now + 0.08 + i * 0.09, 0.06, 0.005, 0.35));
  }

  /** One short soft flute note when dumbo gathers a sparkle; quieter than the squid's notes. */
  dumboNote(): void {
    const ctx = this.live();
    if (!ctx) return;
    const now = ctx.currentTime;
    const f = PENTA[3 + Math.floor(Math.random() * 4)];
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.5;
    const vd = ctx.createGain();
    vd.gain.value = f * 0.01;
    vib.connect(vd);
    vd.connect(o.frequency);
    o.connect(this.env(now, 0.06, 0.04, 0.35));
    o.start(now);
    vib.start(now);
    o.stop(now + 0.45);
    vib.stop(now + 0.45);
  }

  /** Dumbo's soft flute call: three notes, sine with vibrato and a little breath. */
  flute(): void {
    const ctx = this.live();
    if (!ctx || !this.noise) return;
    const now = ctx.currentTime;
    const notes = [783.99, 1046.5, 880.0];
    notes.forEach((f, i) => {
      const at = now + i * 0.18;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const vib = ctx.createOscillator();
      vib.frequency.value = 5.5;
      const vd = ctx.createGain();
      vd.gain.value = f * 0.012;
      vib.connect(vd);
      vd.connect(o.frequency);
      const len = i === notes.length - 1 ? 0.5 : 0.2;
      o.connect(this.env(at, 0.1, 0.05, len));
      o.start(at);
      vib.start(at);
      o.stop(at + len + 0.1);
      vib.stop(at + len + 0.1);
    });
    const breath = ctx.createBufferSource();
    breath.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 2000;
    breath.connect(hp);
    hp.connect(this.env(now, 0.015, 0.05, 0.7));
    breath.start(now);
    breath.stop(now + 0.8);
  }

  /** Low warm pad; a second, higher layer fades in later. */
  private startPad(): void {
    const ctx = this.ctx!;
    const pad = ctx.createGain();
    pad.gain.value = 0.0001;
    pad.gain.setTargetAtTime(0.05, ctx.currentTime, 2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 140;
    lfo.connect(lfoDepth);
    lfoDepth.connect(lp.frequency);
    lfo.start();
    lp.connect(pad);
    pad.connect(this.music!);
    for (const [f, detune] of [
      [65.41, -6],
      [65.41, 6],
      [98.0, 0],
      [130.81, 3],
    ]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = detune;
      o.connect(lp);
      o.start();
    }

    this.padExtra = ctx.createGain();
    this.padExtra.gain.value = 0;
    this.padExtra.connect(this.music!);
    for (const f of [392.0, 523.25, 659.25]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const trem = ctx.createOscillator();
      trem.frequency.value = 0.2 + Math.random() * 0.2;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      const td = ctx.createGain();
      td.gain.value = 0.4;
      trem.connect(td);
      td.connect(g.gain);
      o.connect(g);
      g.connect(this.padExtra);
      o.start();
      trem.start();
    }

    // Twilight's layer: airy, high, slowly breathing fifths; fades in going up.
    this.padTwilight = ctx.createGain();
    this.padTwilight.gain.value = 0;
    this.padTwilight.connect(this.music!);
    for (const f of [523.25, 783.99, 1046.5]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const breathe = ctx.createOscillator();
      breathe.frequency.value = 0.08 + Math.random() * 0.06;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      const bd = ctx.createGain();
      bd.gain.value = 0.45;
      breathe.connect(bd);
      bd.connect(g.gain);
      o.connect(g);
      g.connect(this.padTwilight);
      o.start();
      breathe.start();
    }

    // Whale fall's layer: deep, round notes that swell and fade very slowly, like far-off whale song.
    this.padWhale = ctx.createGain();
    this.padWhale.gain.value = 0;
    this.padWhale.connect(this.music!);
    for (const [f, rate] of [
      [98.0, 0.05],
      [146.83, 0.07],
      [196.0, 0.04],
    ]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const swell = ctx.createOscillator();
      swell.frequency.value = rate;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      const sd = ctx.createGain();
      sd.gain.value = 0.5;
      swell.connect(sd);
      sd.connect(g.gain);
      o.connect(g);
      g.connect(this.padWhale);
      o.start();
      swell.start();
    }

    // The Sunlit reef's layer: a bright major chord in soft bells, each note
    // bouncing at its own quick, playful rate.
    this.padReef = ctx.createGain();
    this.padReef.gain.value = 0;
    this.padReef.connect(this.music!);
    for (const [f, rate] of [
      [523.25, 2.1],
      [659.25, 2.7],
      [783.99, 3.3],
      [1046.5, 1.6],
    ]) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const bounce = ctx.createOscillator();
      bounce.frequency.value = rate;
      const g = ctx.createGain();
      g.gain.value = 0.4;
      const bd = ctx.createGain();
      bd.gain.value = 0.4;
      bounce.connect(bd);
      bd.connect(g.gain);
      o.connect(g);
      g.connect(this.padReef);
      o.start();
      bounce.start();
    }
  }

  /** How much the squid is in the Sunlit reef (0 … 1): its cheerful layer takes over from Twilight's. */
  setReef(amount: number): void {
    this.reef = Math.min(1, Math.max(0, amount));
    if (!this.ctx || !this.padReef) return;
    this.padReef.gain.setTargetAtTime(0.02 * this.reef, this.ctx.currentTime, 1.2);
    this.setZone(this.twilight);
  }

  /** How much the squid is in Whale fall (0 … 1): its deep, slow layer follows it. */
  setWhaleFall(amount: number): void {
    if (!this.ctx || !this.padWhale) return;
    this.padWhale.gain.setTargetAtTime(0.03 * Math.min(1, Math.max(0, amount)), this.ctx.currentTime, 1.2);
  }

  /** How much the squid is in Twilight (0 home … 1 Twilight): the airy layer follows it. */
  setZone(twilight: number): void {
    this.twilight = twilight;
    if (!this.ctx || !this.padTwilight) return;
    this.padTwilight.gain.setTargetAtTime(0.016 * Math.min(1, Math.max(0, twilight)) * (1 - this.reef), this.ctx.currentTime, 1.2);
  }

  /** 0 → 1: how lit the zone is. The extra layer comes in from half lit. */
  setBrightness(lit: number): void {
    if (!this.ctx || !this.padExtra) return;
    const target = lit >= 0.5 ? 0.012 + 0.018 * (lit - 0.5) * 2 : 0;
    this.padExtra.gain.setTargetAtTime(target, this.ctx.currentTime, 1.5);
  }
}

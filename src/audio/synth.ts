/**
 * All game sound, synthesised with Web Audio: no sound files. The context is
 * created on the first interaction (the title-screen tap), never before.
 * Everything goes through one master gain that the mute control sets to 0;
 * muting also suspends the context. A compressor keeps peaks soft.
 */

// C major pentatonic over two octaves: any sequence sounds pleasant.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0];

export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padExtra: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;
  private noteIndex = 3;
  private noteDir = 1;
  private lastNote = 0;

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
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(comp);

    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    void ctx.resume();
    this.startPad();
    if (this.muted) void ctx.suspend();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : 0.8, now, 0.03);
    if (muted) setTimeout(() => this.muted && this.ctx?.suspend(), 150);
    else void this.ctx.resume();
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
    g.connect(this.master!);
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
    pad.connect(this.master!);
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
    this.padExtra.connect(this.master!);
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
  }

  /** 0 → 1: how lit the zone is. The extra layer comes in from half lit. */
  setBrightness(lit: number): void {
    if (!this.ctx || !this.padExtra) return;
    const target = lit >= 0.5 ? 0.012 + 0.018 * (lit - 0.5) * 2 : 0;
    this.padExtra.gain.setTargetAtTime(target, this.ctx.currentTime, 1.5);
  }
}

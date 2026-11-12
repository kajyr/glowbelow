import { language, t, type StringKey } from '../i18n';
import type { StampName } from '../game/worldState';

/**
 * Recorded fun facts, `voice/<lang>/<stamp>.mp3` (for example read by a
 * parent). Found at build time, so they are precached for offline play like
 * the models; none are needed.
 */
const RECORDINGS = import.meta.glob<string>('../../voice/*/*.mp3', { eager: true, query: '?url', import: 'default' });

/** A stamp's fun fact text, or undefined while it has none yet. */
export function factText(stamp: StampName): string | undefined {
  return t(`facts.${stamp}` as StringKey);
}

export type FactSource = { kind: 'recording'; url: string } | { kind: 'speech'; text: string; lang: string };

/** A recording wins; otherwise the device's voice reads the text. */
export function factSource(stamp: StampName, lang: string, recordings: Record<string, string> = RECORDINGS): FactSource | null {
  const url = recordings[`../../voice/${lang}/${stamp}.mp3`];
  if (url) return { kind: 'recording', url };
  const text = factText(stamp);
  return text ? { kind: 'speech', text, lang } : null;
}

/** Plays one fun fact at a time; a new one, closing the album or muting stops it. */
export class FactPlayer {
  private audio: HTMLAudioElement | null = null;
  /** The effects volume, 0 → 1. */
  volume = 1;

  play(stamp: StampName): void {
    this.stop();
    const lang = language();
    const src = factSource(stamp, lang);
    if (!src) return;
    if (src.kind === 'recording') {
      this.audio = new Audio(src.url);
      this.audio.volume = this.volume;
      void this.audio.play().catch(() => {});
      return;
    }
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(src.text);
    u.lang = lang;
    u.voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
    u.volume = this.volume;
    u.rate = 0.9; // a little slower, for small ears
    speechSynthesis.speak(u);
  }

  stop(): void {
    this.audio?.pause();
    this.audio = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }
}

import { t } from '../i18n';
import type { InputKind } from '../game/hints';
import {
  ICON_ALBUM,
  ICON_ARROWS,
  ICON_DRAG,
  ICON_DASH,
  ICON_GLOW,
  ICON_PLAY,
  ICON_ROTATE,
  ICON_SOUND_OFF,
  ICON_SOUND_ON,
  ICON_SPACE,
} from './icons';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  e.innerHTML = html;
  return e;
}

/**
 * The DOM layer over the canvas: title screen, rotate-device overlay, mute,
 * album and glow buttons, the hint icons and the sticker fly-in. Plain DOM,
 * no framework; every hit area is at least 64 px.
 */
export class Hud {
  readonly title: HTMLElement;
  readonly mute: HTMLButtonElement;
  readonly album: HTMLButtonElement;
  readonly glow: HTMLButtonElement;
  private readonly glowFill: HTMLElement;
  readonly dash: HTMLButtonElement;
  private readonly badge: HTMLElement;
  private readonly rotate: HTMLElement;
  private readonly moveHint: HTMLElement;
  private readonly spaceHint: HTMLElement;
  private moveIcons: InputKind | null = null;

  constructor(private readonly root: HTMLElement) {
    this.title = el('div', 'title-screen');
    this.title.innerHTML = `<h1 class="title-name"></h1><button class="play-button" type="button">${ICON_PLAY}</button>`;
    this.title.querySelector('h1')!.textContent = t('title');
    this.title.querySelector('button')!.setAttribute('aria-label', t('play'));

    this.mute = el('button', 'hud-button mute-button', ICON_SOUND_ON);
    this.mute.type = 'button';
    this.mute.setAttribute('aria-label', t('mute'));

    this.album = el('button', 'hud-button album-button', ICON_ALBUM);
    this.album.type = 'button';
    this.album.setAttribute('aria-label', t('album'));
    this.badge = el('span', 'badge');
    this.album.appendChild(this.badge);

    this.glow = el('button', 'glow-button', `<span class="glow-fill"></span><span class="glow-icon">${ICON_GLOW}</span>`);
    this.glow.type = 'button';
    this.glow.setAttribute('aria-label', t('glow'));
    this.glowFill = this.glow.querySelector('.glow-fill')!;
    // Dash sits above glow; its ring fills back up during the cooldown.
    this.dash = el('button', 'dash-button ready', `<span class="dash-ring"></span><span class="dash-icon">${ICON_DASH}</span>`);
    this.dash.type = 'button';
    this.dash.setAttribute('aria-label', t('dash'));

    this.rotate = el('div', 'rotate-overlay', ICON_ROTATE);
    this.rotate.setAttribute('role', 'img');
    this.rotate.setAttribute('aria-label', t('rotate'));

    this.moveHint = el('div', 'hint move-hint');
    this.spaceHint = el('div', 'hint space-hint', ICON_SPACE);

    root.append(this.moveHint, this.spaceHint, this.glow, this.dash, this.album, this.mute, this.title, this.rotate);
    this.setPlaying(false);
  }

  /** True if an event target belongs to the HUD controls (not the play area). */
  isControl(target: EventTarget | null): boolean {
    return target instanceof Element && !!target.closest('button, .title-screen');
  }

  setPlaying(playing: boolean): void {
    this.root.classList.toggle('playing', playing);
    if (playing) this.title.classList.add('gone');
  }

  setMuted(muted: boolean): void {
    this.mute.innerHTML = muted ? ICON_SOUND_OFF : ICON_SOUND_ON;
    this.mute.setAttribute('aria-label', muted ? t('unmute') : t('mute'));
    this.mute.classList.toggle('muted', muted);
  }

  setPortrait(portrait: boolean): void {
    this.rotate.classList.toggle('show', portrait);
  }

  /** Meter 0 → 1; `invite` makes the button pulse. */
  setMeter(value: number, invite: boolean): void {
    this.glowFill.style.transform = `scaleY(${value.toFixed(3)})`;
    this.glow.classList.toggle('full', value >= 1);
    this.glow.classList.toggle('invite', invite);
  }

  /** Dash readiness 0 → 1: the ring fills during the cooldown; at 1 the button looks ready. */
  setDash(readiness: number): void {
    this.dash.style.setProperty('--ready', readiness.toFixed(3));
    this.dash.classList.toggle('ready', readiness >= 1);
  }

  /** Shows the dash button (once unlocked); `reveal` pops it in so the child notices. */
  showDash(reveal: boolean): void {
    this.dash.classList.add('unlocked');
    if (reveal) this.dash.classList.add('reveal');
  }

  /** Quick press feedback on the dash button. */
  dashFlash(): void {
    this.dash.classList.remove('flash');
    void this.dash.offsetWidth;
    this.dash.classList.add('flash');
  }

  /** Quick flash on the button when the squid glows. */
  glowFlash(): void {
    this.glow.classList.remove('flash');
    void this.glow.offsetWidth;
    this.glow.classList.add('flash');
  }

  /** Hints: the move hint near the squid (screen px), the Space key by the glow button. */
  setHints(move: boolean, glow: boolean, icons: InputKind, squid: { x: number; y: number }): void {
    if (this.moveIcons !== icons) {
      this.moveIcons = icons;
      this.moveHint.innerHTML = icons === 'touch' ? ICON_DRAG : ICON_ARROWS;
      this.moveHint.classList.toggle('keys', icons === 'keyboard');
    }
    this.moveHint.classList.toggle('show', move);
    this.moveHint.style.transform = `translate(${Math.round(squid.x + 46)}px, ${Math.round(squid.y - 20)}px)`;
    this.spaceHint.classList.toggle('show', glow && icons === 'keyboard');
  }

  /** The new-sticker badge on the album button. */
  setBadge(show: boolean): void {
    this.badge.classList.toggle('show', show);
  }

  /** A little wiggle of the album button (a sticker arrived). */
  wiggleAlbum(): void {
    this.album.classList.remove('wiggle');
    void this.album.offsetWidth;
    this.album.classList.add('wiggle');
  }

  /** A sticker flies from a screen point into the album button, which then shows a badge. */
  /** A friend's sticker (`art`, an inline SVG) pops up next to it, then flies to the album button. */
  stickerFly(from: { x: number; y: number }, art: string): void {
    const sticker = el('div', 'sticker', art);
    this.root.appendChild(sticker);
    const box = this.root.getBoundingClientRect();
    const target = this.album.getBoundingClientRect();
    const tx = target.left - box.left + target.width / 2;
    const ty = target.top - box.top + target.height / 2;
    sticker.style.transform = `translate(${from.x}px, ${from.y}px) translate(-50%, -50%) scale(0.2)`;
    // Pop up big next to the friend, then fly to the album.
    requestAnimationFrame(() => {
      sticker.classList.add('pop');
      sticker.style.transform = `translate(${from.x}px, ${from.y - 70}px) translate(-50%, -50%) scale(1.4) rotate(-8deg)`;
      setTimeout(() => {
        sticker.classList.remove('pop');
        sticker.classList.add('fly');
        sticker.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%) scale(0.35) rotate(12deg)`;
      }, 1100);
      setTimeout(() => {
        sticker.remove();
        this.badge.classList.add('show');
        this.wiggleAlbum();
      }, 2100);
    });
  }
}

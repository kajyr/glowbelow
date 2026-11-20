import { t } from '../i18n';
import { TUNING } from '../game/tuning';
import type { WorldState } from '../game/worldState';
import { STAR_ICON, type StarfishZone } from './album';

const SHOOTING_STARS = 9;

export interface EndingActions {
  /** Opened or closed: play pauses while it shows. */
  onOpenChange: (open: boolean) => void;
}

/**
 * The ending, at the top of the world (issue #2): shooting stars streak
 * across the screen and a card in the centre shows the starfish found, one
 * strip per zone like the album, lit for found ones. No text. It pauses play
 * like the album and closes on a tap, Space, Enter or Escape (not in its
 * first moment, so a held key or finger does not skip it). Nothing is reset.
 */
export class Ending {
  private readonly overlay: HTMLElement;
  private readonly strips: HTMLElement;
  private readonly sky: HTMLElement;
  open = false;
  private openedAt = 0;

  constructor(
    root: HTMLElement,
    private readonly world: WorldState,
    private readonly zones: StarfishZone[],
    private readonly actions: EndingActions,
  ) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'ending';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-label', t('theEnd'));
    this.overlay.innerHTML = `<div class="ending-sky"></div><div class="ending-card"><div class="ending-burst">${STAR_ICON}</div><div class="ending-strips"></div></div>`;
    this.sky = this.overlay.querySelector('.ending-sky')!;
    this.strips = this.overlay.querySelector('.ending-strips')!;
    root.appendChild(this.overlay);
    this.overlay.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.tryClose();
    });
    window.addEventListener('keydown', (e) => {
      if (this.open && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
        e.preventDefault();
        this.tryClose();
      }
    });
  }

  show(): void {
    if (this.open) return;
    this.open = true;
    this.openedAt = performance.now();
    this.strips.innerHTML = '';
    let lit = 0;
    for (const z of this.zones) {
      const row = document.createElement('div');
      row.className = 'starfish-row';
      row.style.background = z.tint;
      row.innerHTML = z.ids
        .map((id) => {
          const found = this.world.hasFoundStarfish(id);
          // Found starfish pop in one after another, across the strips.
          const delay = found ? 0.6 + 0.12 * lit++ : 0;
          return `<span class="star-icon${found ? ' found' : ''}" style="animation-delay:${delay.toFixed(2)}s">${STAR_ICON}</span>`;
        })
        .join('');
      this.strips.appendChild(row);
    }
    // Shooting stars: each its own height, angle and moment.
    this.sky.innerHTML = Array.from({ length: SHOOTING_STARS }, (_v, i) => {
      const top = 6 + ((i * 37) % 60);
      const delay = (i * 0.45 + (i % 3) * 0.2).toFixed(2);
      const len = 90 + ((i * 53) % 80);
      return `<span class="shooting-star" style="top:${top}%;--len:${len}px;animation-delay:${delay}s"></span>`;
    }).join('');
    this.overlay.classList.add('show');
    this.actions.onOpenChange(true);
  }

  private tryClose(): void {
    if (!this.open || performance.now() - this.openedAt < TUNING.ending.closeAfter * 1000) return;
    this.open = false;
    this.overlay.classList.remove('show');
    this.actions.onOpenChange(false);
  }
}

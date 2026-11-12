import { t } from '../i18n';
import type { Volumes } from '../game/settings';

/** How long the corner control (or the P key) must be held. */
export const HOLD_TIME = 3;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  e.innerHTML = html;
  return e;
}

export interface ParentCornerActions {
  /** Called with new volumes as a slider moves. */
  onVolumes: (v: Volumes) => void;
  /** Erase progress (after the second confirmation). */
  onReset: () => void;
  /** Opened or closed: play pauses while it is open. */
  onOpenChange: (open: boolean) => void;
}

/**
 * The parent corner: a small, dim control in a top corner that opens only
 * after a 3-second hold (a ring fills meanwhile), or after holding P for 3
 * seconds. The panel holds music and effects volume, start over with a
 * confirmation, and — when the page is in a frame that blocks saving — a
 * note with a way to open the game full page. Text labels, since it is for
 * adults.
 */
export class ParentCorner {
  readonly control: HTMLButtonElement;
  private readonly ring: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly confirm: HTMLElement;
  private readonly note: HTMLElement;
  private readonly music: HTMLInputElement;
  private readonly effects: HTMLInputElement;
  private holding: 'pointer' | 'key' | null = null;
  private held = 0;
  open = false;

  constructor(
    root: HTMLElement,
    volumes: Volumes,
    private readonly actions: ParentCornerActions,
  ) {
    this.control = el('button', 'parent-control', '<span class="parent-ring"></span><span class="parent-dots">•••</span>');
    this.control.type = 'button';
    this.control.setAttribute('aria-label', t('grownups'));
    this.ring = this.control.querySelector('.parent-ring')!;

    this.panel = el('div', 'parent-panel');
    this.panel.innerHTML = `
      <div class="parent-card" role="dialog" aria-label="${t('grownups')}">
        <h2>${t('grownups')}</h2>
        <label>${t('music')}<input type="range" min="0" max="100" class="vol-music"></label>
        <label>${t('effects')}<input type="range" min="0" max="100" class="vol-effects"></label>
        <div class="parent-note"><p>${t('noSaveHere')}</p><button type="button" class="full-page">${t('openFullPage')}</button></div>
        <button type="button" class="start-over">${t('startOver')}</button>
        <div class="parent-confirm"><p>${t('startOverAsk')}</p><button type="button" class="erase">${t('erase')}</button><button type="button" class="cancel">${t('cancel')}</button></div>
        <button type="button" class="parent-close">${t('close')}</button>
      </div>`;
    this.music = this.panel.querySelector('.vol-music')!;
    this.effects = this.panel.querySelector('.vol-effects')!;
    this.confirm = this.panel.querySelector('.parent-confirm')!;
    this.note = this.panel.querySelector('.parent-note')!;
    this.music.value = String(Math.round(volumes.music * 100));
    this.effects.value = String(Math.round(volumes.effects * 100));
    root.append(this.control, this.panel);

    const changed = () => this.actions.onVolumes({ music: Number(this.music.value) / 100, effects: Number(this.effects.value) / 100 });
    this.music.addEventListener('input', changed);
    this.effects.addEventListener('input', changed);
    this.panel.querySelector('.start-over')!.addEventListener('click', () => this.confirm.classList.add('show'));
    this.panel.querySelector('.cancel')!.addEventListener('click', () => this.confirm.classList.remove('show'));
    this.panel.querySelector('.erase')!.addEventListener('click', () => this.actions.onReset());
    this.panel.querySelector('.parent-close')!.addEventListener('click', () => this.setOpen(false));
    this.panel.querySelector('.full-page')!.addEventListener('click', () => window.open(location.href, '_blank', 'noopener'));
    // Clicks inside the panel never reach the game.
    this.panel.addEventListener('pointerdown', (e) => e.stopPropagation());

    // Holding the control; letting go early does nothing.
    this.control.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startHold('pointer');
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave'] as const) this.control.addEventListener(ev, () => this.holding === 'pointer' && this.stopHold());
    // Holding P (Shift is not used: it dashes).
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP' && !e.repeat && !this.open) this.startHold('key');
      if (e.code === 'Escape' && this.open) this.setOpen(false);
    });
    window.addEventListener('keyup', (e) => e.code === 'KeyP' && this.holding === 'key' && this.stopHold());
  }

  /** Shows the "can't save here" note (only when a frame blocks storage). */
  setSaveUnavailable(unavailable: boolean): void {
    this.note.classList.toggle('show', unavailable);
  }

  /** Advances a hold; opens once it reaches HOLD_TIME. */
  update(dt: number): void {
    if (!this.holding) return;
    this.held += dt;
    this.ring.style.setProperty('--hold', Math.min(1, this.held / HOLD_TIME).toFixed(3));
    if (this.held >= HOLD_TIME) {
      this.stopHold();
      this.setOpen(true);
    }
  }

  setOpen(open: boolean): void {
    if (open === this.open) return;
    this.open = open;
    this.panel.classList.toggle('show', open);
    if (!open) this.confirm.classList.remove('show');
    this.actions.onOpenChange(open);
  }

  private startHold(by: 'pointer' | 'key') {
    this.holding = by;
    this.held = 0;
    this.control.classList.add('holding');
  }

  private stopHold() {
    this.holding = null;
    this.held = 0;
    this.control.classList.remove('holding');
    this.ring.style.setProperty('--hold', '0');
  }
}

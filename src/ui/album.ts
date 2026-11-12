import { t, type StringKey } from '../i18n';
import type { StampName, WorldState } from '../game/worldState';
import dumboArt from '../../artwork/friends/dumbo-octopus.svg?raw';
import fireflyArt from '../../artwork/friends/firefly-squid.svg?raw';
import nautilusArt from '../../artwork/friends/nautilus.svg?raw';
import cuttlefishArt from '../../artwork/friends/cuttlefish.svg?raw';
import giantSquidArt from '../../artwork/friends/giant-squid.svg?raw';
import starfishArt from '../../artwork/creatures/starfish.svg?raw';
import phantomJellyArt from '../../artwork/creatures/phantom-jelly.svg?raw';
import lanternJellyArt from '../../artwork/creatures/lantern-jelly.svg?raw';

/**
 * Every stamp, in album order (zone by zone, the way they are met): the
 * planned friends and the sea creatures; `art` is the SVG, inlined. Friends
 * not in the game yet stay silhouettes until their zone arrives.
 */
export const ALBUM_STAMPS: { name: StampName; art: string }[] = [
  { name: 'dumbo', art: dumboArt },
  { name: 'starfish', art: starfishArt },
  { name: 'phantom-jelly', art: phantomJellyArt },
  { name: 'firefly', art: fireflyArt },
  { name: 'lantern-jelly', art: lanternJellyArt },
  { name: 'nautilus', art: nautilusArt },
  { name: 'cuttlefish', art: cuttlefishArt },
  { name: 'giant-squid', art: giantSquidArt },
];

/** A stamp's art (the creatures' flying sticker uses it too). */
export const stampArt = (name: StampName): string => ALBUM_STAMPS.find((s) => s.name === name)!.art;

/**
 * The album grid's size for a number of stamps: 3 by 2 at least; past 6 it
 * goes 4 wide (screens are landscape), then grows a row for every 4 more.
 */
export function gridSize(stamps: number): { cols: number; rows: number } {
  const cols = stamps > 6 ? 4 : 3;
  return { cols, rows: Math.max(2, Math.ceil(stamps / cols)) };
}

/** A starfish strip under the grid: one per zone, tinted like its water. */
export interface StarfishZone {
  zone: string;
  tint: string;
  ids: string[];
}

export interface AlbumActions {
  /** Play a stamp's sound (tapping it). */
  onStampSound: (stamp: StampName) => void;
  /** Opened or closed: play pauses while it is open. */
  onOpenChange: (open: boolean) => void;
  /** The new-sticker badge should show or hide. */
  onBadge: (show: boolean) => void;
}

const CLOSE = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 14 L34 34 M34 14 L14 34" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>`;
const STAR_ICON = `<svg viewBox="-50 -50 100 100" aria-hidden="true"><path d="M0,-44 L12,-14 L42,-13 L18,6 L27,36 L0,19 L-27,36 L-18,6 L-42,-13 L-12,-14 Z" fill="currentColor" stroke="currentColor" stroke-width="10" stroke-linejoin="round"/><circle cx="-8" cy="-4" r="4" fill="#4a1b0c"/><circle cx="8" cy="-4" r="4" fill="#4a1b0c"/></svg>`;

/**
 * The sticker album, on one page: a grid of stamps, one per planned friend
 * and sea creature (picture, name and its sound on tap once found; a dark
 * silhouette before), with a strip of starfish per zone underneath. Nothing to
 * turn; closed by the big X, a tap outside, B or Escape. Opening it shows
 * every stamp, so it clears the new-sticker badge; a stamp seen for the first
 * time pops.
 */
export class Album {
  private readonly overlay: HTMLElement;
  private readonly grid: HTMLElement;
  private readonly stars: HTMLElement;
  open = false;

  constructor(
    root: HTMLElement,
    private readonly world: WorldState,
    private readonly actions: AlbumActions,
    private readonly starfish: StarfishZone[] = [],
  ) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'album';
    this.overlay.innerHTML = `
      <div class="album-book">
        <button type="button" class="album-close" aria-label="${t('close')}">${CLOSE}</button>
        <div class="album-grid"></div>
        <div class="album-stars"></div>
      </div>`;
    this.grid = this.overlay.querySelector('.album-grid')!;
    this.stars = this.overlay.querySelector('.album-stars')!;
    const { cols, rows } = gridSize(ALBUM_STAMPS.length);
    this.grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    // The book sizes itself so the whole page fits short screens too (see the CSS).
    const book0 = this.overlay.querySelector('.album-book') as HTMLElement;
    book0.style.setProperty('--cols', String(cols));
    book0.style.setProperty('--rows', String(rows));
    book0.style.setProperty('--zones', String(this.starfish.length));
    root.appendChild(this.overlay);

    const book = this.overlay.querySelector('.album-book')!;
    // A tap outside the book closes it; nothing in the album reaches the game.
    this.overlay.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (!book.contains(e.target as Node)) this.setOpen(false);
    });
    this.overlay.querySelector('.album-close')!.addEventListener('click', () => this.setOpen(false));
    window.addEventListener('keydown', (e) => this.open && e.code === 'Escape' && this.setOpen(false));
    this.updateBadge();
  }

  setOpen(open: boolean): void {
    if (open === this.open) return;
    this.open = open;
    if (open) this.show();
    this.overlay.classList.toggle('show', open);
    this.actions.onOpenChange(open);
  }

  toggle(): void {
    this.setOpen(!this.open);
  }

  /** The badge shows while a found stamp has not been seen. */
  updateBadge(): void {
    this.actions.onBadge(this.world.unviewed.length > 0);
  }

  private show(): void {
    this.grid.innerHTML = '';
    for (const f of ALBUM_STAMPS) {
      const found = this.world.hasFound(f.name);
      const stamp = document.createElement('div');
      // Inlined, so a silhouette can drop the art's background card and darken only the friend.
      stamp.className = `stamp${found ? ' found' : ''}${found && this.world.unviewed.includes(f.name) ? ' new' : ''}`;
      stamp.innerHTML = found
        ? `<div class="friend-art">${f.art}</div><p class="friend-name">${t(`friend.${f.name}` as StringKey)}</p>`
        : `<div class="friend-art" role="img" aria-label="${t('notFound')}">${f.art}</div>`;
      if (!found) stamp.querySelector('svg')?.setAttribute('aria-hidden', 'true');
      else stamp.addEventListener('click', () => this.actions.onStampSound(f.name));
      this.grid.appendChild(stamp);
    }
    this.stars.innerHTML = '';
    for (const z of this.starfish) {
      const row = document.createElement('div');
      row.className = 'starfish-row';
      row.style.background = z.tint;
      row.innerHTML = z.ids.map((id) => `<span class="star-icon${this.world.hasFoundStarfish(id) ? ' found' : ''}">${STAR_ICON}</span>`).join('');
      this.stars.appendChild(row);
    }
    // Every stamp is in view now: nothing is unseen any more.
    for (const f of this.world.unviewed) this.world.view(f);
    this.updateBadge();
  }
}

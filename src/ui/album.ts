import { t, type StringKey } from '../i18n';
import { factText } from '../audio/facts';
import { ICON_SOUND_ON } from './icons';
import type { StampName, WorldState } from '../game/worldState';
import { COLOUR_HEX, GLOW_COLOURS, type GlowColour } from '../game/colours';
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
  { name: 'giant-squid', art: giantSquidArt },
  { name: 'cuttlefish', art: cuttlefishArt },
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
  /** Speak a stamp's fun fact (its speaker icon). */
  onFact: (stamp: StampName) => void;
  /** Opened or closed: play pauses while it is open. */
  onOpenChange: (open: boolean) => void;
  /** The new-sticker badge should show or hide. */
  onBadge: (show: boolean) => void;
  /** An unlocked glow colour was chosen. */
  onChooseGlow: (colour: GlowColour) => void;
}

/** The glow-colour dots, in the cycle's order: teal first. */
export function colourDots(world: Pick<WorldState, 'isUnlocked' | 'glowColour'>): { colour: GlowColour; unlocked: boolean; chosen: boolean }[] {
  return GLOW_COLOURS.map((colour) => ({ colour, unlocked: world.isUnlocked(colour), chosen: world.glowColour === colour }));
}

/** The dots sit in rows of this many. */
export const DOTS_PER_ROW = 3;

/** Moving between the dots with the arrow keys (rows of three, no wrapping): the dot to go to. */
export function dotAfter(index: number, key: string, count: number = GLOW_COLOURS.length): number {
  const col = index % DOTS_PER_ROW;
  const step: Record<string, number> = { ArrowLeft: col > 0 ? -1 : 0, ArrowRight: col < DOTS_PER_ROW - 1 ? 1 : 0, ArrowUp: -DOTS_PER_ROW, ArrowDown: DOTS_PER_ROW };
  const next = index + (step[key] ?? 0);
  return next >= 0 && next < count ? next : index;
}

/** The fun-fact speaker is hidden until the facts sound good (see `voice-recordings`). */
const FACT_SPEAKER = false;

/**
 * The completed stamp: like a real rubber stamp, red ink in a double ring
 * with the word round the top and a star in the middle, the edges roughened
 * by a noise filter and the ink a little patchy.
 */
function doneStamp(word: string): string {
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="grain"/>
      <feDisplacementMap in="SourceGraphic" in2="grain" scale="5" result="rough"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="blots"/>
      <feColorMatrix in="blots" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9" result="patchy"/>
      <feComposite in="rough" in2="patchy" operator="in"/>
    </filter>
    <path id="arc" d="M 38 100 A 62 62 0 0 1 162 100"/>
  </defs>
  <g filter="url(#ink)" fill="none" stroke="currentColor">
    <circle cx="100" cy="100" r="92" stroke-width="9"/>
    <circle cx="100" cy="100" r="78" stroke-width="3.5"/>
    <text font-family="'Trebuchet MS', 'Arial Rounded MT Bold', sans-serif" font-weight="900" font-size="25" letter-spacing="3" fill="currentColor" stroke="none" text-anchor="middle"><textPath href="#arc" startOffset="50%">${word.toUpperCase()}</textPath></text>
    <path d="M100,92 L111,120 L141,121 L117,139 L126,168 L100,151 L74,168 L83,139 L59,121 L89,120 Z" fill="currentColor" stroke="none" transform="translate(0 -18)"/>
    <path d="M44 132 Q100 172 156 132" stroke-width="3.5"/>
  </g>
</svg>`;
}

const CLOSE = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 14 L34 34 M34 14 L14 34" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>`;
export const STAR_ICON = `<svg viewBox="-50 -50 100 100" aria-hidden="true"><path d="M0,-44 L12,-14 L42,-13 L18,6 L27,36 L0,19 L-27,36 L-18,6 L-42,-13 L-12,-14 Z" fill="currentColor" stroke="currentColor" stroke-width="10" stroke-linejoin="round"/><circle cx="-8" cy="-4" r="4" fill="#4a1b0c"/><circle cx="8" cy="-4" r="4" fill="#4a1b0c"/></svg>`;

/**
 * The sticker album, on one page: a grid of stamps, one per planned friend
 * and sea creature (picture, name, its sound on tap and a speaker for its fun
 * fact once found; a dark silhouette before), with a strip of starfish per
 * zone underneath, and beside the strips the squid's glow colours: unlocked
 * ones in their colour, the rest dark, a ring round the chosen one. Nothing
 * to turn; closed by the big X, a tap outside, B or Escape. Opening it shows
 * every stamp, so it clears the new-sticker badge; a stamp seen for the first
 * time pops.
 */
export class Album {
  private readonly overlay: HTMLElement;
  private readonly grid: HTMLElement;
  private readonly stars: HTMLElement;
  private readonly colours: HTMLElement;
  private readonly done: HTMLElement;
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
        <div class="album-bottom">
          <div class="album-stars"></div>
          <div class="album-done">${doneStamp(t('completed'))}</div>
          <div class="album-colours"></div>
        </div>
      </div>`;
    this.grid = this.overlay.querySelector('.album-grid')!;
    this.stars = this.overlay.querySelector('.album-stars')!;
    this.colours = this.overlay.querySelector('.album-colours')!;
    this.done = this.overlay.querySelector('.album-done')!;
    const { cols, rows } = gridSize(ALBUM_STAMPS.length);
    // Never bigger than the height allows (the book may be wider than the stamps need).
    this.grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, var(--cell)))`;
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
    // Arrows move between the glow colours; Space or Enter picks one (the dots are buttons).
    window.addEventListener('keydown', (e) => {
      if (!this.open || !e.code.startsWith('Arrow')) return;
      e.preventDefault();
      const dots = [...this.colours.querySelectorAll<HTMLButtonElement>('.colour-dot')];
      const at = dots.indexOf(document.activeElement as HTMLButtonElement);
      const from = at >= 0 ? at : Math.max(0, dots.findIndex((d) => d.classList.contains('chosen')));
      dots[at >= 0 ? dotAfter(from, e.code) : from]?.focus();
    });
    this.updateBadge();
  }

  setOpen(open: boolean): void {
    if (open === this.open) return;
    this.open = open;
    if (open) this.show();
    this.overlay.classList.toggle('show', open);
    this.actions.onOpenChange(open);
  }

  /**
   * The journey is completed: the album opens and the completed stamp
   * thumps down onto the page. Afterwards the stamp stays on the page.
   */
  stampCompleted(): void {
    this.setOpen(true);
    this.done.classList.remove('show', 'slam');
    void this.done.offsetWidth;
    this.done.classList.add('slam');
  }

  toggle(): void {
    this.setOpen(!this.open);
  }

  /** The glow colours: tapping an unlocked one wears it; a dark one only wiggles. */
  private showColours(): void {
    this.colours.innerHTML = '';
    for (const d of colourDots(this.world)) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `colour-dot${d.unlocked ? '' : ' locked'}${d.chosen ? ' chosen' : ''}`;
      dot.style.setProperty('--dot', d.unlocked ? COLOUR_HEX[d.colour] : '#3b3f5e');
      dot.setAttribute('aria-label', t('glowColour'));
      dot.setAttribute('aria-pressed', String(d.chosen));
      dot.innerHTML = '<span></span>';
      dot.addEventListener('click', () => {
        if (!d.unlocked) {
          dot.classList.remove('wiggle');
          void dot.offsetWidth;
          dot.classList.add('wiggle');
          return;
        }
        this.actions.onChooseGlow(d.colour);
        const focused = document.activeElement === dot;
        this.showColours();
        if (focused) this.colours.querySelectorAll<HTMLButtonElement>('.colour-dot')[GLOW_COLOURS.indexOf(d.colour)]?.focus();
      });
      this.colours.appendChild(dot);
    }
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
      if (FACT_SPEAKER && found && factText(f.name)) {
        const speaker = document.createElement('button');
        speaker.type = 'button';
        speaker.className = 'fact-speaker';
        speaker.setAttribute('aria-label', t('hearFact'));
        speaker.innerHTML = `<span>${ICON_SOUND_ON}</span>`;
        speaker.addEventListener('click', (e) => {
          e.stopPropagation(); // the fact, not the stamp's own sound
          this.actions.onFact(f.name);
        });
        stamp.appendChild(speaker);
      }
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
    this.showColours();
    this.done.classList.toggle('show', this.world.completed);
    this.done.classList.remove('slam');
    // Every stamp is in view now: nothing is unseen any more.
    for (const f of this.world.unviewed) this.world.view(f);
    this.updateBadge();
  }
}

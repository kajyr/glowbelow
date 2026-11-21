// Store media from the game itself: Play screenshots per device size and the feature graphic.
//
//     npm run capture:store
//
// Builds the app target (no service worker), serves it with `vite preview`, opens it in
// headed Chromium (so WebGL runs on the GPU) with a fixed world (?seed) and stages each
// scene through the debug handle `window.game` (?debug). Writes into docs/play/.
// The same seed and scenes give the same pictures every run.

import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = `${ROOT}docs/play`;
const PORT = 5179;
const SEED = 7;

/** Play's screenshot sets: CSS viewport × device scale = the stored size. */
const DEVICES = [
  { name: 'phone', width: 1280, height: 720, scale: 1.5 }, // 1920×1080
  { name: 'tablet7', width: 1280, height: 800, scale: 1.5 }, // 1920×1200
  { name: 'tablet10', width: 1280, height: 800, scale: 2 }, // 2560×1600
];

const FRIENDS = ['dumbo', 'firefly', 'nautilus', 'starfish', 'phantom-jelly', 'lantern-jelly', 'giant-squid', 'cuttlefish'];

/** Debug text and the "drag here" hint stay out of the pictures. */
const CLEAN = `div[style*="monospace"], .hint { display: none !important; }`;

/** Each scene stages the world, then waits for it to settle. */
const SCENES = [
  {
    name: '1-home',
    async stage(page) {
      await page.evaluate(() => {
        game.lightAll();
        const home = game.gameWorld.map.zones.find((z) => z.name === 'home').rect;
        const plants = game.plants.plants.filter((p) => p.x > home.minX && p.x < home.maxX && p.y < home.maxY);
        // The plant with the most others within a screen's width, so the shot is full of light.
        const near = (p) => plants.filter((q) => Math.abs(q.x - p.x) < 12 && Math.abs(q.y - p.y) < 6).length;
        const p = plants.reduce((best, q) => (near(q) > near(best) ? q : best));
        game.teleport(p.x, p.y + 3.5);
      });
      await page.waitForTimeout(5000);
    },
  },
  {
    name: '2-twilight',
    async stage(page) {
      await page.evaluate(() => {
        const z = game.gameWorld.map.zones.find((z) => z.name === 'twilight').rect;
        game.teleport((z.minX + z.maxX) / 2, (z.minY + z.maxY) / 2);
      });
      await page.waitForTimeout(2500);
    },
  },
  {
    name: '3-whale-fall',
    async stage(page) {
      await page.evaluate(() => {
        game.giant.restore();
        game.teleport(game.giant.pos.x + 6, game.giant.pos.y - 1);
      });
      await page.waitForTimeout(2500);
    },
  },
  {
    name: '4-sunlit-reef',
    async stage(page) {
      await page.evaluate(() => {
        const z = game.gameWorld.map.zones.find((z) => z.name === 'sunlit-reef').rect;
        game.teleport((z.minX + z.maxX) / 2, z.minY + 5);
      });
      await page.waitForTimeout(2500);
    },
  },
  {
    name: '5-album',
    async stage(page) {
      await page.evaluate((friends) => {
        for (const f of friends) game.worldState.find(f);
        game.album.setOpen(true);
      }, FRIENDS);
      await page.waitForTimeout(1500);
    },
  },
];

async function open(browser, d) {
  const context = await browser.newContext({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: d.scale });
  // Silent: the game remembers mute.
  await context.addInitScript(() => localStorage.setItem('glowbelow.muted', '1'));
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`http://localhost:${PORT}/?seed=${SEED}&debug`);
  // `window.game` is also the #game element until the debug handle replaces it.
  await page.waitForFunction(() => window.game?.play, null, { timeout: 30000 });
  await page.addStyleTag({ content: CLEAN });
  return { context, page };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  execSync('npm run build:app', { cwd: ROOT, stdio: 'ignore' });
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore', detached: true });
  try {
    await new Promise((r) => setTimeout(r, 2500));
    const browser = await chromium.launch({ headless: false });

    for (const d of DEVICES) {
      const { context, page } = await open(browser, d);
      await page.evaluate(() => game.play());
      for (const scene of SCENES) {
        await scene.stage(page);
        await page.screenshot({ path: `${OUT}/${d.name}-${scene.name}.png` });
        console.log(`wrote docs/play/${d.name}-${scene.name}.png`);
      }
      await context.close();
    }

    // Feature graphic: the title screen at 1024×500, without the play button.
    const { context, page } = await open(browser, { width: 1024, height: 500, scale: 1 });
    await page.addStyleTag({ content: '.play-button, .hud-button, .parent-control { visibility: hidden !important; }' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}/feature-graphic.png` });
    console.log('wrote docs/play/feature-graphic.png');
    await context.close();

    await browser.close();
  } finally {
    process.kill(-server.pid); // the whole group: npx and the vite it started
  }
}

await main();

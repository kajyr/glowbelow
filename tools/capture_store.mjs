// Store media from the game itself: Play screenshots per device size, the feature graphic,
// and (with --video) a 20–30 s promo video with the game's own sound.
//
//     npm run capture:store              # screenshots and feature graphic
//     npm run capture:store -- --video   # the promo video too (needs ffmpeg)
//
// Builds the app target (no service worker), serves it with `vite preview`, opens it in
// headed Chromium (so WebGL runs on the GPU) with a fixed world (?seed) and stages each
// scene through the debug handle `window.game` (?debug). Writes into docs/play/.
// The same seed and scenes give the same pictures every run.

import { execSync, spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, rmSync } from 'node:fs';
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

async function open(browser, d, sound = false) {
  const context = await browser.newContext({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: d.scale });
  // The game remembers mute: silent for screenshots, sound on for the video.
  await context.addInitScript((muted) => localStorage.setItem('glowbelow.muted', muted), sound ? '0' : '1');
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`http://localhost:${PORT}/?seed=${SEED}&debug`);
  // `window.game` is also the #game element until the debug handle replaces it.
  await page.waitForFunction(() => window.game?.play, null, { timeout: 30000 });
  await page.addStyleTag({ content: CLEAN });
  return { context, page };
}

const hold = async (page, key, ms) => {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
};
const glow = (page) => page.keyboard.press('Space');
const zone = (page, name) => page.evaluate((n) => game.gameWorld.map.zones.find((z) => z.name === n).rect, name);

/**
 * The promo video: real play only, cut between places. Recorded inside the page (the
 * canvas plus the game's sound into one webm), so no screen recorder or audio driver is
 * needed. HTML on top of the canvas (HUD, album) is not recorded: the video shows the
 * clean game, and the album stays in the screenshots.
 */
async function video(browser) {
  const webm = `${OUT}/promo.webm`;
  rmSync(webm, { force: true });
  const { context, page } = await open(browser, { width: 1280, height: 720, scale: 1.5 }, true);
  await page.exposeFunction('saveChunk', (b64) => appendFileSync(webm, Buffer.from(b64, 'base64')));
  await page.evaluate(() => game.play());
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const stream = document.querySelector('canvas').captureStream(30);
    for (const t of game.synth.captureStream()?.getAudioTracks() ?? []) stream.addTrack(t);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 16e6 });
    let chain = Promise.resolve();
    rec.ondataavailable = (e) => {
      chain = chain.then(async () => {
        const bytes = new Uint8Array(await e.data.arrayBuffer());
        let s = '';
        for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        await window.saveChunk(btoa(s));
      });
    };
    window.recording = { rec, done: () => new Promise((r) => { rec.onstop = () => chain.then(r); rec.stop(); }) };
    rec.start(1000);
  });

  // Home: glow among the plants and watch them bloom.
  await page.evaluate(() => {
    const home = game.gameWorld.map.zones.find((z) => z.name === 'home').rect;
    const plants = game.plants.plants.filter((p) => p.x > home.minX && p.x < home.maxX && p.y < home.maxY);
    const near = (p) => plants.filter((q) => Math.abs(q.x - p.x) < 12 && Math.abs(q.y - p.y) < 6).length;
    const p = plants.reduce((best, q) => (near(q) > near(best) ? q : best));
    game.teleport(p.x - 7, p.y + 3);
  });
  await glow(page);
  await hold(page, 'ArrowRight', 1600);
  await glow(page);
  await hold(page, 'ArrowRight', 1400);
  await glow(page);
  await hold(page, 'ArrowUp', 1000);
  await page.waitForTimeout(1500);

  // Twilight: a swim between the phantom jellies.
  const tw = await zone(page, 'twilight');
  await page.evaluate(([x, y]) => game.teleport(x, y), [tw.minX + 10, (tw.minY + tw.maxY) / 2]);
  await hold(page, 'ArrowRight', 2200);
  await hold(page, 'ArrowUp', 1200);
  await glow(page);
  await hold(page, 'ArrowRight', 1500);
  await page.waitForTimeout(500);

  // Whale fall: the ribs play like a xylophone, then the giant squid wakes.
  await page.evaluate(() => {
    game.giant.restore();
    game.teleport(game.giant.pos.x + 9, game.giant.pos.y - 2);
    game.lightAll();
  });
  await page.waitForTimeout(2500);
  await hold(page, 'ArrowLeft', 1500);
  await glow(page);
  await hold(page, 'ArrowRight', 1500);
  await page.waitForTimeout(500);

  // The sunlit reef.
  const reef = await zone(page, 'sunlit-reef');
  await page.evaluate(([x, y]) => game.teleport(x, y), [(reef.minX + reef.maxX) / 2 - 8, reef.minY + 5]);
  await hold(page, 'ArrowRight', 2400);
  await glow(page);
  await hold(page, 'ArrowUp', 1200);
  await glow(page);
  await page.waitForTimeout(1500);

  await page.evaluate(() => window.recording.done());
  await context.close();

  // 1080p H.264 + AAC, at most 30 s, ready for YouTube (and App Store previews later).
  execSync(
    `ffmpeg -y -loglevel error -i "${webm}" -t 30 -vf "scale=1920:1080:flags=lanczos,fps=30" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart "${OUT}/promo.mp4"`,
  );
  rmSync(webm, { force: true });
  console.log('wrote docs/play/promo.mp4');
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  execSync('npm run build:app', { cwd: ROOT, stdio: 'ignore' });
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore', detached: true });
  try {
    await new Promise((r) => setTimeout(r, 2500));
    // Sound may start without a tap (the video calls game.play() from the script).
    const browser = await chromium.launch({ headless: false, args: ['--autoplay-policy=no-user-gesture-required'] });
    if (process.argv.includes('--video')) {
      await video(browser);
      if (process.argv.includes('--only-video')) return void (await browser.close());
    }

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

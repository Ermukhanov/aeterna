import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

async function startVite() {
  const proc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5179', '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Vite startup timeout')), 10000);
    proc.stdout.on('data', (d) => {
      if (d.toString().includes('5179')) {
        clearTimeout(t);
        resolve();
      }
    });
    proc.stderr.on('data', (d) => process.stderr.write(d));
  });
  return proc;
}

const vite = await startVite();
let browser;
try {
  browser = await puppeteer.launch({
    executablePath: CHROME_PATHS[0],
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('http://localhost:5179/', { waitUntil: 'networkidle0' });

  // 1. Splash -> Lobby
  await page.waitForSelector('.splash');
  await page.click('.splash');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:\\Users\\Acer Nitro\\.gemini\\antigravity\\brain\\7afdb38b-bf2b-4036-9de1-67ef3cc70534\\verify_1_lobby.png' });

  // 2. Click "New Campaign" -> Rome District + Intro overlay
  await page.click('.menu .item[data-act="new"]');
  await new Promise((r) => setTimeout(r, 1500));

  const introInfo = await page.evaluate(() => ({
    scene: window.__AETERNA__.manager.currentName,
    introText: document.querySelector('.intro .line')?.textContent.trim(),
    heroWho: document.querySelector('.intro .who')?.textContent.trim(),
  }));
  console.log('INTRO_INFO:', JSON.stringify(introInfo));
  await page.screenshot({ path: 'C:\\Users\\Acer Nitro\\.gemini\\antigravity\\brain\\7afdb38b-bf2b-4036-9de1-67ef3cc70534\\verify_2_intro.png' });

  // Wait for intro overlay to fade, then test WASD + Horse riding (E) + Forum view
  await new Promise((r) => setTimeout(r, 5600));

  // Press E to mount warhorse (horse starts within 7m of hero)
  await page.keyboard.press('KeyE');
  await new Promise((r) => setTimeout(r, 200));

  // Ride north through Triumphal Arch into Forum Romanum (hold W + Shift)
  await page.keyboard.down('ShiftLeft');
  await page.keyboard.down('KeyW');
  await new Promise((r) => setTimeout(r, 2100));
  await page.keyboard.up('KeyW');
  await page.keyboard.up('ShiftLeft');

  const districtForumState = await page.evaluate(() => {
    const ctx = window.__AETERNA__;
    const s = ctx.manager.current;
    return {
      mounted: s.hero.mounted,
      pos: { x: +s.hero.position.x.toFixed(1), z: +s.hero.position.z.toFixed(1) },
      crowdCount: s.crowd.activeCount,
      statusText: document.querySelector('[data-role="status"]')?.textContent,
      draws: ctx.renderer.info.render.calls,
      tris: ctx.renderer.info.render.triangles,
    };
  });
  console.log('DISTRICT_FORUM_STATE:', JSON.stringify(districtForumState));
  await page.screenshot({ path: 'C:\\Users\\Acer Nitro\\.gemini\\antigravity\\brain\\7afdb38b-bf2b-4036-9de1-67ef3cc70534\\verify_3_forum_mounted.png' });

  // 3. Test Day/Night slider (set to 18.2 golden sunset, then 21.5 night with braziers) + look toward Colosseum & Senate
  await page.evaluate(() => {
    const s = window.__AETERNA__.manager.current;
    s.setHour(17.8);
    s.camYaw = -1.15; // look east toward Senate & Colosseum
    s.camPitch = 0.22;
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: 'C:\\Users\\Acer Nitro\\.gemini\\antigravity\\brain\\7afdb38b-bf2b-4036-9de1-67ef3cc70534\\verify_4_colosseum_sunset.png' });

  await page.evaluate(() => {
    const s = window.__AETERNA__.manager.current;
    s._setMounted(false);
    s.hero.position.set(-28, 0, 28); // Market Street at night
    s.camYaw = 1.4;
    s.camPitch = 0.22;
    s.setHour(21.2);
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: 'C:\\Users\\Acer Nitro\\.gemini\\antigravity\\brain\\7afdb38b-bf2b-4036-9de1-67ef3cc70534\\verify_5_market_night.png' });

  if (errors.length) {
    console.error('CONSOLE_ERRORS:', errors);
    process.exitCode = 1;
  } else {
    console.log('ALL_BROWSER_CHECKS_PASSED');
  }
} finally {
  await browser?.close();
  vite.kill();
}

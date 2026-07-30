/**
 * PWA用アイコンを images/favicon.svg から生成する。
 *
 * 使い方: node scripts/generate-pwa-icons.js
 * 生成物（リポジトリにコミットする）:
 *   images/icon-192.png          通常アイコン
 *   images/icon-512.png          通常アイコン（インストールUI・スプラッシュ用）
 *   images/icon-maskable-512.png maskable用。OSが円形などに切り抜くため
 *                                安全領域（中央80%）に収まるよう縮小して全面を背景色で塗る
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'images');
const BG = '#0a0a0f';

const TARGETS = [
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  // maskable は最大40%が切り落とされる想定。中央に72%で配置する
  { file: 'icon-maskable-512.png', size: 512, scale: 0.72 },
];

function findChromium() {
  const root = '/opt/pw-browsers';
  if (!fs.existsSync(root)) return undefined;
  for (const dir of fs.readdirSync(root)) {
    const p = path.join(root, dir, 'chrome-linux', 'chrome');
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

(async () => {
  let chromium;
  try {
    ({ chromium } = require('playwright-core'));
  } catch {
    ({ chromium } = require('playwright'));
  }

  const svg = fs.readFileSync(path.join(IMAGES, 'favicon.svg'), 'utf8');

  const browser = await chromium.launch({
    executablePath: findChromium(),
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const results = [];
  for (const { file, size, scale } of TARGETS) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });

    const inner = Math.round(size * scale);
    await page.setContent(
      '<!DOCTYPE html><html><head><style>'
      + `html,body{margin:0;padding:0;overflow:hidden;background:${BG}}`
      + `body{width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center}`
      + `svg{width:${inner}px;height:${inner}px;display:block}`
      + '</style></head><body>' + svg + '</body></html>'
    );

    await page.screenshot({ path: path.join(IMAGES, file), type: 'png' });
    results.push({ file, size, kb: fs.statSync(path.join(IMAGES, file)).size / 1024 });
    await page.close();
  }

  await browser.close();
  for (const r of results) console.log(`${r.file.padEnd(28)} ${r.size}x${r.size}  ${r.kb.toFixed(1)}KB`);
})();

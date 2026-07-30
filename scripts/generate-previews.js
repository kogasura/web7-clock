/**
 * トップページのカード用プレビュー画像を生成する。
 *
 * 目的:
 *  - トップページで時計12種を iframe でライブ表示していたため、
 *    スロットリングした端末ではメインスレッドが飽和し 36fps まで落ちていた。
 *    静的画像に置き換えることで初期表示を軽くする。
 *  - <img alt> になることで Google 画像検索の流入経路になる。
 *
 * 前提: ローカルに静的サーバーが必要（例: npx serve -l 8899）
 * 使い方: node scripts/generate-previews.js [http://127.0.0.1:8899]
 * 生成物: images/previews/<id>.jpg（リポジトリにコミットする）
 *
 * 全カードで同じ時刻に見えるよう Date を 10:09:36 に固定してから撮影する。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'previews');
const BASE = process.argv[2] || 'http://127.0.0.1:8899';

// カード幅は最大約390pxなので、2倍解像度を賄える768pxで書き出す
const WIDTH = 768;
const HEIGHT = 432; // 16:9（カードの aspect-ratio と一致）
const QUALITY = 80;

const CLOCKS = [
  'neon', 'minimal', 'retro', 'matrix', 'gradient', 'flip',
  'cyber', 'terminal', 'glass', 'forest', 'fireplace', 'ocean',
];

// 撮影時刻を固定（見栄えのする時刻に揃える）
const FROZEN = new Date('2026-01-15T10:09:36').getTime();

function findChromium() {
  const roots = ['/opt/pw-browsers'];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const dir of fs.readdirSync(root)) {
      const p = path.join(root, dir, 'chrome-linux', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined; // playwright の既定解決に任せる
}

(async () => {
  let chromium;
  try {
    ({ chromium } = require('playwright-core'));
  } catch {
    ({ chromium } = require('playwright'));
  }

  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    executablePath: findChromium(),
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const results = [];
  for (const id of CLOCKS) {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });

    // 全カードの表示時刻を揃える。
    // Date を自前で差し替えるとタイマーがずれてFLIPのめくり途中が写るため、
    // setInterval まで面倒を見てくれる page.clock を使う。
    await page.clock.install({ time: FROZEN });

    await page.goto(`${BASE}/clocks/${id}/`, { waitUntil: 'load' });

    // 仮想時間を進めてsetIntervalを走らせ、めくりアニメーションを完了させる
    await page.clock.runFor(1500);
    // アニメーション（CSS側は実時間で動く）が定常状態になるまで待つ
    await page.waitForTimeout(2600);

    const file = path.join(OUT, `${id}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: QUALITY });
    results.push({ id, kb: fs.statSync(file).size / 1024 });
    await page.close();
  }

  await browser.close();

  for (const r of results) console.log(`${r.id.padEnd(12)} ${r.kb.toFixed(1).padStart(6)}KB`);
  console.log(`\n${results.length} previews, ${results.reduce((a, r) => a + r.kb, 0).toFixed(1)}KB total -> images/previews/`);
})();

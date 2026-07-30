/**
 * 時計ページごとの個別OGP画像を生成する。
 *
 * 目的: SNS・AI検索の結果カードでデザインごとの見た目が伝わるようにする。
 *       12ページで共通の images/og.png を使っていると、どのデザインの
 *       ページを開くのか分からずクリック率が落ちる。
 *
 * 前提: ローカルに静的サーバーが必要（例: npx serve -l 8899）
 * 使い方: node scripts/generate-og-images.js [http://127.0.0.1:8899]
 * 生成物: images/social/<id>.jpg（1200x630・リポジトリにコミットする）
 *
 * プレビュー画像と同じく page.clock で表示時刻を10:09に固定する。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'social');
const BASE = process.argv[2] || 'http://127.0.0.1:8899';

const WIDTH = 1200;
const HEIGHT = 630;
const QUALITY = 82;

const CLOCKS = [
  ['neon', 'NEON', 'ネオンサイン風グロウエフェクト'],
  ['minimal', 'MINIMAL', '洗練されたミニマルデザイン'],
  ['retro', 'RETRO LED', 'レトロ LED セグメントディスプレイ'],
  ['matrix', 'MATRIX', 'マトリックスコードレイン + 時計'],
  ['gradient', 'GRADIENT', '時間で変化するグラデーション背景'],
  ['flip', 'FLIP', 'パタパタ時計風フリップアニメーション'],
  ['cyber', 'CYBER', 'サイバーパンク / グリッチエフェクト'],
  ['terminal', 'TERMINAL', 'ターミナル風コマンドライン時計'],
  ['glass', 'GLASS', 'グラスモーフィズム + 浮遊背景'],
  ['forest', 'FOREST', '深い森の木漏れ日と霧'],
  ['fireplace', 'FIREPLACE', '揺れる炎と舞う火の粉'],
  ['ocean', 'OCEAN', '月夜の海と波のアニメーション'],
];

const FROZEN = new Date('2026-01-15T10:09:36').getTime();

function overlayCss() {
  return `
    /* 画面上のUIはOGP画像に写さない */
    .back-link, .fullscreen-btn, .format-toggle, .design-switcher, .noscript-message {
      display: none !important;
    }
    #__ogp {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      z-index: 9999;
      padding: 92px 56px 34px;
      background: linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.62) 45%, rgba(0,0,0,0) 100%);
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 32px;
      pointer-events: none;
    }
    #__ogp .n {
      font-family: 'Orbitron', sans-serif;
      font-weight: 700;
      font-size: 46px;
      letter-spacing: 0.06em;
      line-height: 1.1;
      color: #ffffff;
      text-shadow: 0 2px 18px rgba(0,0,0,0.65);
    }
    #__ogp .d {
      margin-top: 10px;
      font-size: 24px;
      font-weight: 400;
      letter-spacing: 0.02em;
      color: rgba(255,255,255,0.82);
      text-shadow: 0 2px 14px rgba(0,0,0,0.7);
    }
    #__ogp .b {
      flex: 0 0 auto;
      font-family: 'Orbitron', sans-serif;
      font-size: 19px;
      letter-spacing: 0.16em;
      color: rgba(255,255,255,0.6);
      text-align: right;
      text-shadow: 0 2px 14px rgba(0,0,0,0.7);
    }
  `;
}

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

  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    executablePath: findChromium(),
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const results = [];
  for (const [id, name, desc] of CLOCKS) {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });

    await page.clock.install({ time: FROZEN });
    await page.goto(`${BASE}/clocks/${id}/`, { waitUntil: 'load' });
    await page.clock.runFor(1500);

    await page.addStyleTag({ content: overlayCss() });
    await page.evaluate(([n, d]) => {
      const el = document.createElement('div');
      el.id = '__ogp';
      const left = document.createElement('div');
      const nameEl = document.createElement('div');
      nameEl.className = 'n';
      nameEl.textContent = n;
      const descEl = document.createElement('div');
      descEl.className = 'd';
      descEl.textContent = d;
      left.append(nameEl, descEl);
      const brand = document.createElement('div');
      brand.className = 'b';
      brand.textContent = 'WEB7 CLOCK';
      el.append(left, brand);
      document.body.appendChild(el);
    }, [name, desc]);

    await page.waitForTimeout(2600);

    const file = path.join(OUT, `${id}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: QUALITY });
    results.push({ id, kb: fs.statSync(file).size / 1024 });
    await page.close();
  }

  await browser.close();

  for (const r of results) console.log(`${r.id.padEnd(12)} ${r.kb.toFixed(1).padStart(6)}KB`);
  console.log(`\n${results.length} OGP images, ${results.reduce((a, r) => a + r.kb, 0).toFixed(1)}KB total -> images/social/`);
})();

/**
 * PWA の Web App Manifest を生成する（ブラウザ不要）。
 *
 * 使い方: node scripts/generate-manifests.js
 * 生成物（リポジトリにコミットする）:
 *   manifest.webmanifest              トップページ用（時計一覧が開く）
 *   clocks/<id>/manifest.webmanifest  デザインごと（そのデザインが直接開く）
 *
 * 常時表示が主用途なので、時計ページからインストールしたときは
 * そのデザインが全画面で起動するように start_url / display を分けている。
 * scope は全て "/" にして、アプリ内から一覧や他デザインへ移動しても
 * ブラウザに飛び出さないようにする。アプリの同一性は id で区別する。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CLOCKS = [
  ['neon', 'NEON', 'ネオンサイン風グロウエフェクト', '#0a0a0f'],
  ['minimal', 'MINIMAL', '洗練されたミニマルデザイン', '#fafafa'],
  ['retro', 'RETRO LED', 'レトロ LED セグメントディスプレイ', '#1a0a0a'],
  ['matrix', 'MATRIX', 'マトリックスコードレイン + 時計', '#000000'],
  ['gradient', 'GRADIENT', '時間で変化するグラデーション背景', '#000000'],
  ['flip', 'FLIP', 'パタパタ時計風フリップアニメーション', '#1a1a2e'],
  ['cyber', 'CYBER', 'サイバーパンク / グリッチエフェクト', '#0a0012'],
  ['terminal', 'TERMINAL', 'ターミナル風コマンドライン時計', '#0c0c0c'],
  ['glass', 'GLASS', 'グラスモーフィズム + 浮遊背景', '#0f0f23'],
  ['forest', 'FOREST', '深い森の木漏れ日と霧', '#0a1a0a'],
  ['fireplace', 'FIREPLACE', '揺れる炎と舞う火の粉', '#0f0804'],
  ['ocean', 'OCEAN', '月夜の海と波のアニメーション', '#040810'],
];

// インストールUIのショートカットに載せる代表デザイン
const SHORTCUTS = ['neon', 'minimal', 'flip', 'ocean'];

const ICONS = [
  { src: '/images/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/images/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];

function write(file, obj) {
  const p = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
  return p;
}

// --- トップページ用 ---
const byId = new Map(CLOCKS.map(([id, name, desc]) => [id, { name, desc }]));

write('manifest.webmanifest', {
  id: '/',
  name: 'Web7 Clock — デジタル時計コレクション',
  short_name: 'Web7 Clock',
  description: 'ブラウザで開くだけで使える無料のデジタル時計。12デザインから選んで全画面で常時表示できます。',
  lang: 'ja',
  dir: 'ltr',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'any',
  background_color: '#0a0a0f',
  theme_color: '#0a0a0f',
  categories: ['utilities', 'productivity'],
  icons: ICONS,
  screenshots: [
    {
      src: '/images/og.png',
      sizes: '1200x630',
      type: 'image/png',
      form_factor: 'wide',
      label: 'Web7 Clock のデジタル時計一覧',
    },
  ],
  shortcuts: SHORTCUTS.map((id) => ({
    name: `${byId.get(id).name} — ${byId.get(id).desc}`,
    short_name: byId.get(id).name,
    url: `/clocks/${id}/`,
  })),
});

// --- 時計ページ用 ---
for (const [id, name, desc, theme] of CLOCKS) {
  write(`clocks/${id}/manifest.webmanifest`, {
    id: `/clocks/${id}/`,
    name: `${name} — Web7 Clock`,
    short_name: name,
    description: `${desc}のデジタル時計。全画面で常時表示できます。`,
    lang: 'ja',
    dir: 'ltr',
    start_url: `/clocks/${id}/`,
    scope: '/',
    // 常時表示が主用途なので全画面優先。非対応環境は standalone に落ちる
    display: 'fullscreen',
    display_override: ['fullscreen', 'standalone'],
    orientation: 'any',
    background_color: theme,
    theme_color: theme,
    categories: ['utilities', 'productivity'],
    icons: ICONS,
    screenshots: [
      {
        src: `/images/social/${id}.jpg`,
        sizes: '1200x630',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: `${name} — ${desc}`,
      },
    ],
  });
}

console.log(`manifests written: 1 (top) + ${CLOCKS.length} (clocks)`);

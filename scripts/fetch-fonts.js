/**
 * Google Fonts から woff2（latin サブセット）を取得して fonts/ にセルフホストする。
 *
 * 目的:
 *  - fonts.googleapis.com / fonts.gstatic.com への外部リクエストを無くし表示速度を上げる
 *    （トップページは iframe 12個 + 親の計13ドキュメントから個別にフォントを取得していた）
 *  - オフラインでもWeb版・デスクトップ版が同じ見た目になる
 *
 * 使い方: node scripts/fetch-fonts.js
 * 生成物: fonts/*.woff2, fonts/fonts.css（どちらもリポジトリにコミットする）
 *
 * 全ファミリー SIL Open Font License 1.1。帰属表示は fonts/LICENSE.md を参照。
 * latin-ext / cyrillic / greek は本サイトで使わないため取得しない。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT = path.resolve(__dirname, '..', 'fonts');

// [Google Fonts の family クエリ, 出力ファイル名のベース]
const FAMILIES = [
  ['Orbitron:wght@400..900', 'orbitron'],
  ['Inter:wght@100..600', 'inter'],
  ['Outfit:wght@100..600', 'outfit'],
  ['Cormorant+Garamond:wght@300..500', 'cormorant-garamond'],
  ['Bebas+Neue', 'bebas-neue'],
  ['Share+Tech+Mono', 'share-tech-mono'],
  ['JetBrains+Mono:wght@300..700', 'jetbrains-mono'],
];

// woff2 と可変フォントを返させるために新しめのブラウザを装う
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function curl(url, outFile) {
  const args = ['-sS', '--fail', '-A', UA, url];
  if (outFile) args.push('-o', outFile);
  return execFileSync('curl', args, { maxBuffer: 1 << 28 }).toString();
}

fs.mkdirSync(OUT, { recursive: true });

const faces = [];
const summary = [];

for (const [query, base] of FAMILIES) {
  const css = curl(`https://fonts.googleapis.com/css2?family=${query}&display=swap`);

  // Google Fonts の CSS は「/* subset */ @font-face {...}」の繰り返し
  const blocks = [...css.matchAll(/\/\*\s*([a-z0-9-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/gi)];
  if (!blocks.length) throw new Error(`@font-face を解析できません: ${base}`);

  const latin = blocks.filter(([, subset]) => subset === 'latin');
  if (!latin.length) throw new Error(`latin サブセットが見つかりません: ${base}`);

  for (const [, , block] of latin) {
    const family = /font-family:\s*'([^']+)'/.exec(block)[1];
    const style = (/font-style:\s*([^;]+);/.exec(block) || [, 'normal'])[1].trim();
    const weight = (/font-weight:\s*([^;]+);/.exec(block) || [, '400'])[1].trim();
    const range = (/unicode-range:\s*([^;]+);/.exec(block) || [, null])[1];
    const src = /url\((https:\/\/[^)]+\.woff2)\)/.exec(block)[1];

    const file = `${base}.woff2`;
    curl(src, path.join(OUT, file));
    summary.push({ file, family, weight, kb: fs.statSync(path.join(OUT, file)).size / 1024 });

    faces.push(
      '@font-face {\n'
      + `  font-family: '${family}';\n`
      + `  font-style: ${style};\n`
      + `  font-weight: ${weight};\n`
      + '  font-display: swap;\n'
      + `  src: url('${file}') format('woff2');\n`
      // unicode-range を残すことで、日本語などは端末のシステムフォントに委ねる
      + (range ? `  unicode-range: ${range};\n` : '')
      + '}'
    );
  }
}

const header = `/*
 * Web7 Clock - セルフホストWebフォント（自動生成 / 手で編集しない）
 *
 * 生成: node scripts/fetch-fonts.js
 * 内容: Google Fonts の latin サブセット woff2。外部リクエストなしで表示するため同梱。
 * ライセンス: 全ファミリー SIL Open Font License 1.1（fonts/LICENSE.md 参照）
 */

`;

fs.writeFileSync(path.join(OUT, 'fonts.css'), header + faces.join('\n\n') + '\n');

for (const s of summary) console.log(`${s.file.padEnd(28)} ${s.kb.toFixed(1).padStart(6)}KB  ${s.family} ${s.weight}`);
console.log(`\n${summary.length} files, ${summary.reduce((a, s) => a + s.kb, 0).toFixed(1)}KB total -> fonts/`);

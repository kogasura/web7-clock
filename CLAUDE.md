# Web7 Clock - Digital Clock Display Service

## 概要
clock.web7.tokyo で公開するデジタル時計表示サービス。
常時表示用途。CSS アニメーション + JavaScript で動くかっこいいデジタル時計を複数デザイン提供。
Web版とWindowsデスクトップアプリ版を同一リポジトリで管理し、時計デザインを共有。

## 技術スタック
- **Web版**: HTML5 / CSS3 / Vanilla JavaScript（フレームワーク不使用）
- **デスクトップ版**: Tauri v2（Rust + WebView2）

## ディレクトリ構造
```
web7-clock/
├── index.html          # Web版トップページ（時計一覧・選択画面）
├── guide/              # 常時表示ガイド（焼き付き対策・画面設定・用途別の選び方）
├── clocks/             # 各時計デザイン（Web・デスクトップ共有）
│   ├── neon/           # ネオン風デジタル時計
│   ├── minimal/        # ミニマルデザイン
│   ├── retro/          # レトロ LED 風
│   ├── matrix/         # マトリックス風
│   ├── gradient/       # グラデーション時計
│   ├── flip/           # フリップ時計
│   ├── cyber/          # サイバーパンク風
│   ├── terminal/       # ターミナル風
│   ├── glass/          # グラスモーフィズム
│   ├── forest/         # 森（自然系）
│   ├── fireplace/      # 暖炉（自然系）
│   └── ocean/          # 海（自然系）
├── css/
│   └── common.css      # 共通スタイル
├── js/
│   ├── clock.js        # 共通時計ロジック（DigitalClock クラス）
│   └── pwa.js          # Service Worker 登録（Web版のみ・dist へは非同梱）
├── images/             # OGP画像・favicon・カード用プレビュー
│   ├── og.png          # OGP画像 1200x630（Web版専用・dist へは非同梱）
│   ├── favicon.svg     # ファビコン
│   ├── apple-touch-icon.png
│   ├── icon-192.png / icon-512.png / icon-maskable-512.png  # PWA用（dist へは非同梱）
│   ├── previews/       # トップのカード画像 12枚（Web版専用・dist へは非同梱）
│   └── social/         # 時計ページ個別のOGP画像 12枚 1200x630（同上）
├── fonts/              # セルフホストWebフォント（latin woff2 7種 + fonts.css）
├── manifest.webmanifest # PWAマニフェスト（トップ用。時計ページ用は clocks/<id>/ に個別配置）
├── sw.js               # Service Worker（Web版のみ・キャッシュ／オフライン対応）
├── robots.txt          # クロール許可 + sitemap 参照（Web版のみ）
├── sitemap.xml         # 14URL（トップ + ガイド + 時計12ページ）（Web版のみ）
├── llms.txt            # AIO向け構造化サマリ（Web版のみ）
├── .htaccess           # gzip圧縮・キャッシュ制御（Web版のみ）
├── package.json        # Tauri CLI 依存
├── scripts/
│   ├── copy-assets.js       # ビルド時に dist/ へWebアセットをコピー
│   ├── fetch-fonts.js       # Google Fonts から woff2 を取得して fonts/ を再生成
│   ├── generate-previews.js # 時計12種を撮影して images/previews/ を再生成
│   ├── generate-og-images.js # 時計12種の個別OGP画像 images/social/ を再生成
│   ├── generate-pwa-icons.js # favicon.svg から PWA アイコンを生成
│   └── generate-manifests.js # 13個の manifest.webmanifest を生成
├── src-tauri/          # デスクトップアプリ（Rust）
│   ├── src/main.rs     # メインロジック（トレイ、メニュー、設定）
│   ├── tauri.conf.json # Tauri設定
│   ├── capabilities/   # Tauri v2 パーミッション
│   ├── Cargo.toml
│   └── icons/          # アプリアイコン
└── dist/               # ビルド時生成（.gitignore）
```

## コード共有の仕組み
- `clocks/`, `css/`, `js/`, `fonts/` は Web版・デスクトップ版で完全共有
- 時計デザインを更新すると両方に自動反映
- デスクトップ固有の機能は `src-tauri/` に分離
- Web版デプロイ時は `src-tauri/`, `node_modules/`, `dist/` 等を除外

## デスクトップアプリ

### 機能
- ボーダーレスウィンドウ（タイトルバーなし）
- 常時最前面表示（トグル可能）
- ドラッグ移動、自由リサイズ
- 右クリックメニューでデザイン切替（12種類）
- システムトレイアイコン
- 設定永続化（時計・位置・サイズを自動保存）

### ビルド方法
MSVC環境変数の設定が必要（Git Bash から実行する場合）:
```bash
MSVC_PATH="/c/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/MSVC/14.44.35207/bin/Hostx64/x64"
SDK_LIB="/c/Program Files (x86)/Windows Kits/10/Lib/10.0.26100.0"
MSVC_LIB="/c/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/MSVC/14.44.35207/lib/x64"
SDK_INCLUDE="/c/Program Files (x86)/Windows Kits/10/Include/10.0.26100.0"
MSVC_INCLUDE="/c/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/MSVC/14.44.35207/include"

export PATH="$MSVC_PATH:$PATH"
export LIB="$MSVC_LIB;$SDK_LIB/um/x64;$SDK_LIB/ucrt/x64"
export INCLUDE="$MSVC_INCLUDE;$SDK_INCLUDE/ucrt;$SDK_INCLUDE/um;$SDK_INCLUDE/shared"

npx tauri build
```

### ビルド前提条件
- Rust (stable-x86_64-pc-windows-msvc)
- Visual Studio 2022 Community + Windows 11 SDK
- Node.js

### 成果物
- `src-tauri/target/release/web7-clock-desktop.exe`（単体実行可能）
- `src-tauri/target/release/bundle/nsis/Web7 Clock_*-setup.exe`（インストーラー）
- `src-tauri/target/release/bundle/msi/Web7 Clock_*.msi`（MSI）

### 設定ファイル
`%APPDATA%/web7-clock/settings.json` に自動保存

## SEO / AIO 対策

### 構成
- **メタ情報**: 全14ページ（トップ + ガイド + 時計12種）に title / description / canonical / OGP / Twitter Card を個別設定
- **OGP画像**: トップは `images/og.png`、時計12ページは `images/social/<id>.jpg` の個別画像（すべて1200x630）。`summary_large_image`
- **構造化データ（JSON-LD）**:
  - トップ: `Organization` / `WebSite` / `WebApplication` / `SoftwareApplication`（アプリ版）/ `ItemList`（12デザイン）/ `FAQPage`
  - 各時計ページ: `WebApplication` / `BreadcrumbList`
  - ガイド: `Article` / `BreadcrumbList`（トップの `WebSite` から `hasPart` で参照）
- **クロール制御**: `robots.txt` で検索エンジンとAIクローラ（GPTBot, ClaudeBot, PerplexityBot 等）を明示的に許可、`sitemap.xml` を参照
- **AIO**: `llms.txt` にサイト概要・12デザインの説明・アプリ版の機能・FAQ をプレーンテキストで記述
- **本文コンテンツ**: トップページに特徴 / 使い方 / 用途 / FAQ セクションを配置（AIに抽出させるための本文を確保）
- **時計ページの本文**: 画面は時計のみのため、`.visually-hidden` の h1 と説明文でページ内容を伝える。JS無効時は `noscript` で案内
- **内部リンク**: 時計ページ下部にホバーで出る `.design-switcher`（他11デザインへのリンク）を配置。
  以前は「← COLLECTION」だけの行き止まりだった。現在ページは `<span aria-current="page">` にして自己リンクを作らない。
  ライトテーマの MINIMAL だけ CSS変数（`--switcher-fg` 等）を上書きして配色を反転させている。
  デスクトップ版では `src-tauri/src/main.rs` の初期化スクリプトで非表示にする（切替は右クリックメニュー）

### コンテンツ（`guide/`）
技術的な対策だけでは順位が付かないので、実用情報のページを持たせている。

- `guide/index.html` — 常時表示ガイド。約3,700文字、時計12ページへの内部リンク36本
- 内容: 有機ELの焼き付き対策 / 消費電力 / 画面の自動消灯対策 / フルスクリーンの出し方 /
  ホーム画面への追加 / デザイン早見表（秒表示・背景の動き・明るさ）/ 用途別のおすすめ
- 早見表の「秒表示あり／なし」は推測ではなく実測して埋めた
  （時計ページを2.2秒空けて2回テキスト取得し、変化したかで判定）。
  **デザインを追加・変更したら早見表も更新する**
- OGP画像は共通の `images/og.png` を使用（専用画像は未作成）
- 導線: トップの「使い方」セクションとフッター、`llms.txt`、`sitemap.xml`

### 画面の自動消灯対策（Screen Wake Lock）
常時表示が主用途なので `js/clock.js` で `navigator.wakeLock` を取得する。

- 取得するのは**フルスクリーン中**、または**インストール済みアプリとして起動中**
  （`display-mode: fullscreen` / `standalone`）のときだけ。
  常に取得しないのはバッテリーを勝手に消費しないため
- `fullscreenchange` と `visibilitychange` で取り直す（タブを離れるとロックは自動解放される）
- 非対応ブラウザや拒否時は何もしない。その場合はOS側の設定で対応する旨をガイドに書いている

### 表示設定（24H / 12H）
- 切替UI: 時計ページ右上の「24H / 12H」ボタン。`js/clock.js` が生成し `body:hover` で表示する
  （12種類のページはそれぞれ独自に描画しているため、各ページに手を入れず共通側から差し込んでいる）
- 優先順位: URLパラメータ `?h=12` / `?h=24` > localStorage の保存値 > ページの既定値
  URL指定を残しているのはキオスク端末やブックマークで表記を固定したいケースのため
- AM/PM は `.clock-container` の末尾に `.meridiem-display` として共通で出す
  （各ページの `onTick` は `data.period` を使っていないので、共通側で `onTick` を包んで描画している）
- デスクトップ版では `main.rs` の初期化スクリプトで `.format-toggle` を非表示にする
- タイムゾーン切替は未実装（端末のローカルタイムゾーン固定）

### 時計の描画頻度（常時表示なので電力に直結する）
`DigitalClock` の `precision` オプションで制御する。

- `'second'`（既定）: 次の秒の頭に `setTimeout` を張り、秒が変わったときだけ描画する
- `'frame'`: `requestAnimationFrame` で毎フレーム描画。ミリ秒表示や滑らかなバーがある場合のみ使う
  → 現在は CYBER（ミリ秒表示）と GRADIENT（秒バー）だけが指定している

対策前は全ページが毎フレーム描画で、1秒あたり60回のうち59回は同じ文字列を
`innerHTML` に書き直していた。4倍スロットリング環境・5秒間の計測値:

| デザイン | DOM書込 前→後 | メインスレッド占有 前→後 |
|---|---|---|
| MINIMAL | 300回 → 5回 | 0.61s → **0.03s** |
| TERMINAL | 300回 → 5回 | 0.63s → **0.04s** |
| OCEAN | 301回 → 5回 | 1.02s → **0.05s** |
| NEON | 261回 → 5回 | 1.96s → 1.57s（残りはCSSの反射アニメーション） |
| MATRIX | 301回 → 5回 | 2.19s → 1.55s（残りはコードレイン描画） |
| CYBER | 300回（意図通り） | 0.97s → 1.06s（ミリ秒表示のため据え置き） |

**新しい時計を作るときは必ず `DigitalClock` を使うこと。**
独自に `setInterval` を書くと 24H/12H 切替とAM/PM表示が効かない
（FLIP が独自実装だったため後から共通化した）。

### PWA（再訪流入とオフライン対応）
常時表示が主用途なので、タブレットやサブモニターに「置きっぱなし」にできることを重視している。

- **マニフェストは13個**（`scripts/generate-manifests.js` で生成）
  - トップ用: `start_url: "/"` / `display: standalone`
  - 時計ページ用: `start_url: "/clocks/<id>/"` / `display: fullscreen` / `theme_color` は各デザインの背景色
  - → 時計ページからインストールすると、そのデザインが全画面で直接起動する
  - `scope` は全て `"/"`。アプリ内から一覧や他デザインへ移動してもブラウザに飛び出さない。
    アプリの同一性は `id` で区別している
- **Service Worker（`sw.js`）**
  - HTML（ナビゲーション）は network-first。更新をすぐ反映させるため
  - 静的アセットは cache-first
  - プリキャッシュは全13ページ + CSS/JS/フォント7種/プレビュー12枚の計37エントリ（約600KB）。
    時計ページを含めているのは、未訪問デザインをオフラインで開いたときに
    URLだけ `/clocks/xxx/` でトップの中身が出る状態を避けるため
  - **★ css / js / fonts / 画像を変更したら `sw.js` の `VERSION` を上げること。**
    上げ忘れると古いアセットが配信され続ける
- **`.htaccess`**: `sw.js` は `no-store`（ここをキャッシュすると更新版SWが届かない）。
  `.webmanifest` は 1時間
- **デスクトップ版には入れない**: `copy-assets.js` がマニフェスト・`pwa.js`・PWAアイコンを除外し、
  コピー後のHTMLから `<link rel="manifest">` と `pwa.js` の `<script>` を削除する（`stripWebOnlyTags`）

### 表示速度対策（流入に直結するので落とさないこと）
4倍CPUスロットリング環境での計測値:

| | 対策前 | フォント同梱後 | プレビュー画像化後 |
|---|---|---|---|
| DOMContentLoaded | 13,232ms | 778ms | **82ms** |
| リクエスト数 | 51 | 114 | **15** |
| 外部フォント取得 | 13 | 0 | **0** |
| FPS（定常） | 60※ | 36 | **60** |
| メインスレッド占有 | 1.23s | 6.88s | **0.64s** |
| DOMノード数 | 1,963 | 5,870 | **550** |

※ 対策前の60fpsは iframe の読み込みがフォント待ちで完了していなかったため。実際に12個が動き出すと36fpsまで落ちていた。

やったこと:
1. **Webフォントのセルフホスト** — Google Fonts への `<link>` をやめ `fonts/fonts.css` を参照。
   トップページは iframe 12個 + 親の計13ドキュメントから個別に外部フォントを取得しており、これがレンダリングブロックの主因だった。
   `unicode-range` を残しているので日本語は端末のシステムフォントで描画される。
2. **トップのカードを静的プレビュー画像化** — ライブ `iframe` 12個をやめ `images/previews/*.jpg` に置換。
   `<img alt>` になるので Google画像検索の流入経路にもなる。
   PCでホバーしたカードだけライブ `iframe` に差し替える（同時に生かすのは常に1枚）。
   タッチ端末と `prefers-reduced-motion: reduce` では画像のまま。

### 時計デザインを追加・変更したときの更新箇所
新しい時計を追加した場合は、`clocks/<id>/` の作成だけでなく以下も必ず更新する:
1. `index.html` — カード追加 + JSON-LD の `ItemList`（`numberOfItems` と `itemListElement`）
2. `sitemap.xml` — URL 追加 + `lastmod` 更新
3. `llms.txt` — デザイン一覧に追記
4. `clocks/<id>/index.html` — 他ページと同じメタ情報一式（title / description / canonical / OGP / JSON-LD）と、`.visually-hidden` の h1・説明文
5. `src-tauri/src/main.rs` の `CLOCKS`、`scripts/copy-assets.js` の `TRANSPARENT_CLOCKS`（透過対応する場合）
   および `css/common.css` の `.design-switcher` に載せる全12ページ分のリンク（各ページのHTML内）
6. **プレビュー画像とOGP画像の再生成** — ローカルに静的サーバーを立てて
   `node scripts/generate-previews.js` と `node scripts/generate-og-images.js`
   （両スクリプトの `CLOCKS` 配列にもIDを追加する）
   ※ `Date` を自前で差し替えると FLIP のめくり途中が写るため、時刻の固定は `page.clock` を使うこと
7. 新しいWebフォントを使う場合は `scripts/fetch-fonts.js` の `FAMILIES` に追加して再実行。
   Google Fonts を直接 `<link>` で読み込まないこと（表示速度が落ちる）
8. `scripts/generate-manifests.js` の `CLOCKS` に追加して再実行（マニフェストを生成）
9. `sw.js` の `PRECACHE` に `/clocks/<id>/` とプレビュー画像を追加し、`VERSION` を上げる
10. `guide/index.html` のデザイン早見表と用途別セクションに追記する
11. 時計ロジックは必ず `DigitalClock` を使う（24H/12H切替・AM/PM表示・画面消灯対策が共通側にあるため）。
    ミリ秒や滑らかなバーが必要な場合だけ `precision: 'frame'` を指定する

### 未対応・任意項目
- HTTP → HTTPS 転送はロリポップのコントロールパネル側で設定する（`.htaccess` には入れていない）
- Google Search Console / Bing Webmaster Tools への `sitemap.xml` 登録は手動
- ガイドページ専用のOGP画像は未作成（共通の `og.png` を使用）
- タイムゾーン切替・秒表示のON/OFF は未実装
  （秒は7ページが独自に描画しているため、共通の切替を入れるには各ページの `onTick` 修正が必要）
- 英語版・hreflang は未対応（日本語のみ）

## 開発フロー
- GitHub Flow（main + feature ブランチ）
- feature ブランチから PR 作成時にレビューエージェントがレビュー
- レビュー通過後にマージ

## Web版デプロイ
- ロリポップ SSH 経由
- サーバーパス: ~/web/ai-services/clock/
- サブドメイン: clock.web7.tokyo
- **重要**: `ai-services/` 以外のフォルダは絶対に触らない
- デプロイは必ず `~/web/ai-services/clock/` 配下のみに対して行う
- デプロイ対象外: `src-tauri/`, `node_modules/`, `dist/`, `scripts/`, `package.json`, `package-lock.json`
- デプロイ対象に含める: `robots.txt`, `sitemap.xml`, `llms.txt`, `.htaccess`, `images/`, `fonts/`,
  `sw.js`, `manifest.webmanifest`（+ `clocks/<id>/manifest.webmanifest`）
  （`.htaccess` はドットファイルなので rsync 等で漏れやすい。`fonts/` が抜けると全ページのフォントが崩れる。
  `sw.js` が抜けると既存の訪問者に古いキャッシュが残り続ける）

## デスクトップアプリ リリース手順
1. バージョン番号を更新: `tauri.conf.json`, `Cargo.toml`, `package.json`
2. 変更をコミット & push
3. タグ作成: `git tag v{X.Y.Z} && git push origin v{X.Y.Z}`
4. GitHub Actions が自動でビルド → GitHub Releases にインストーラーをアップロード
5. clock.web7.tokyo のダウンロードセクションが GitHub API 経由で自動更新
6. Web版の変更がある場合はロリポップにデプロイ

## Gitコミットルール
- コミットメッセージに Co-Authored-By 等のAIツール使用を示す記述を含めない

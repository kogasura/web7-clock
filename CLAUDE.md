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
│   └── clock.js        # 共通時計ロジック（DigitalClock クラス）
├── images/             # OGP画像・favicon
│   ├── og.png          # OGP画像 1200x630（Web版専用・dist へは非同梱）
│   ├── favicon.svg     # ファビコン
│   └── apple-touch-icon.png
├── robots.txt          # クロール許可 + sitemap 参照（Web版のみ）
├── sitemap.xml         # 13URL（トップ + 時計12ページ）（Web版のみ）
├── llms.txt            # AIO向け構造化サマリ（Web版のみ）
├── .htaccess           # gzip圧縮・キャッシュ制御（Web版のみ）
├── package.json        # Tauri CLI 依存
├── scripts/
│   └── copy-assets.js  # ビルド時に dist/ へWebアセットをコピー
├── src-tauri/          # デスクトップアプリ（Rust）
│   ├── src/main.rs     # メインロジック（トレイ、メニュー、設定）
│   ├── tauri.conf.json # Tauri設定
│   ├── capabilities/   # Tauri v2 パーミッション
│   ├── Cargo.toml
│   └── icons/          # アプリアイコン
└── dist/               # ビルド時生成（.gitignore）
```

## コード共有の仕組み
- `clocks/`, `css/`, `js/` は Web版・デスクトップ版で完全共有
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
- **メタ情報**: 全13ページ（トップ + 時計12種）に title / description / canonical / OGP / Twitter Card を個別設定
- **OGP画像**: `images/og.png`（1200x630）を全ページ共通で使用。`summary_large_image`
- **構造化データ（JSON-LD）**:
  - トップ: `Organization` / `WebSite` / `WebApplication` / `SoftwareApplication`（アプリ版）/ `ItemList`（12デザイン）/ `FAQPage`
  - 各時計ページ: `WebApplication` / `BreadcrumbList`
- **クロール制御**: `robots.txt` で検索エンジンとAIクローラ（GPTBot, ClaudeBot, PerplexityBot 等）を明示的に許可、`sitemap.xml` を参照
- **AIO**: `llms.txt` にサイト概要・12デザインの説明・アプリ版の機能・FAQ をプレーンテキストで記述
- **本文コンテンツ**: トップページに特徴 / 使い方 / 用途 / FAQ セクションを配置（AIに抽出させるための本文を確保）
- **時計ページの本文**: 画面は時計のみのため、`.visually-hidden` の h1 と説明文でページ内容を伝える。JS無効時は `noscript` で案内

### 時計デザインを追加・変更したときの更新箇所
新しい時計を追加した場合は、`clocks/<id>/` の作成だけでなく以下も必ず更新する:
1. `index.html` — カード追加 + JSON-LD の `ItemList`（`numberOfItems` と `itemListElement`）
2. `sitemap.xml` — URL 追加 + `lastmod` 更新
3. `llms.txt` — デザイン一覧に追記
4. `clocks/<id>/index.html` — 他ページと同じメタ情報一式（title / description / canonical / OGP / JSON-LD）と、`.visually-hidden` の h1・説明文
5. `src-tauri/src/main.rs` の `CLOCKS`、`scripts/copy-assets.js` の `TRANSPARENT_CLOCKS`（透過対応する場合）

### 未対応・任意項目
- HTTP → HTTPS 転送はロリポップのコントロールパネル側で設定する（`.htaccess` には入れていない）
- Google Search Console / Bing Webmaster Tools への `sitemap.xml` 登録は手動
- 時計ページごとの個別OGP画像は未作成（共通の `og.png` を使用）

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
- デプロイ対象に含める: `robots.txt`, `sitemap.xml`, `llms.txt`, `.htaccess`, `images/`（SEO/AIO用。ドットファイルなので rsync 等で漏れやすい点に注意）

## デスクトップアプリ リリース手順
1. バージョン番号を更新: `tauri.conf.json`, `Cargo.toml`, `package.json`
2. 変更をコミット & push
3. タグ作成: `git tag v{X.Y.Z} && git push origin v{X.Y.Z}`
4. GitHub Actions が自動でビルド → GitHub Releases にインストーラーをアップロード
5. clock.web7.tokyo のダウンロードセクションが GitHub API 経由で自動更新
6. Web版の変更がある場合はロリポップにデプロイ

## Gitコミットルール
- コミットメッセージに Co-Authored-By 等のAIツール使用を示す記述を含めない

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
├── images/             # OGP画像等
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

## Gitコミットルール
- コミットメッセージに Co-Authored-By 等のAIツール使用を示す記述を含めない

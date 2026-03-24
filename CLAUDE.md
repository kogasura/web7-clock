# Web7 Clock - Digital Clock Display Service

## 概要
clock.web7.tokyo で公開するデジタル時計表示サービス。
常時表示用途。CSS アニメーション + JavaScript で動くかっこいいデジタル時計を複数デザイン提供。

## 技術スタック
- HTML5 / CSS3 / Vanilla JavaScript（フレームワーク不使用）
- 静的サイト（サーバーサイド処理なし）

## ディレクトリ構造
```
web7-clock/
├── index.html          # トップページ（時計一覧・選択画面）
├── clocks/             # 各時計デザイン
│   ├── neon/           # ネオン風デジタル時計
│   ├── minimal/        # ミニマルデザイン
│   ├── retro/          # レトロ LED 風
│   ├── matrix/         # マトリックス風
│   └── gradient/       # グラデーション時計
├── css/
│   └── common.css      # 共通スタイル
├── js/
│   └── clock.js        # 共通時計ロジック
└── images/             # OGP画像等
```

## 開発フロー
- GitHub Flow（main + feature ブランチ）
- feature ブランチから PR 作成時にレビューエージェントがレビュー
- レビュー通過後にマージ

## デプロイ
- ロリポップ SSH 経由
- サーバーパス: ~/web/ai-services/clock/
- サブドメイン: clock.web7.tokyo
- **重要**: `ai-services/` 以外のフォルダは絶対に触らない
- デプロイは必ず `~/web/ai-services/clock/` 配下のみに対して行う

## Gitコミットルール
- コミットメッセージに Co-Authored-By 等のAIツール使用を示す記述を含めない

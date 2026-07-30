# 同梱Webフォントのライセンス

このディレクトリの `.woff2` は Google Fonts で配布されているフォントの **latin サブセット**です。
表示速度改善（外部リクエストの排除）とオフライン表示のため、リポジトリに同梱しています。
取得は `node scripts/fetch-fonts.js` で再現できます。

**7ファミリーすべて SIL Open Font License 1.1 (OFL-1.1)** で配布されています。
OFL は再配布・埋め込み・サブセット化を許可しています（フォント自体を販売しないこと、
Reserved Font Name を変更後の名前に使わないことが条件）。

| ファイル | ファミリー | 権利表示 | 制作者 |
|---|---|---|---|
| `orbitron.woff2` | Orbitron | Copyright 2018 The Orbitron Project Authors (https://github.com/theleagueof/orbitron), with Reserved Font Name: "Orbitron" | Matt McInerney |
| `inter.woff2` | Inter | Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter) | Rasmus Andersson |
| `outfit.woff2` | Outfit | Copyright 2021 The Outfit Project Authors (https://github.com/Outfitio/Outfit-Fonts) | Smartsheet Inc; Rodrigo Fuenzalida |
| `cormorant-garamond.woff2` | Cormorant Garamond | Copyright 2015 the Cormorant Project Authors (github.com/CatharsisFonts/Cormorant) | Christian Thalmann |
| `bebas-neue.woff2` | Bebas Neue | Copyright © 2010 by Dharma Type. | Ryoichi Tsunekawa |
| `share-tech-mono.woff2` | Share Tech Mono | Copyright (c) 2012, Carrois Type Design, Ralph du Carrois (post@carrois.com www.carrois.com), with Reserved Font Name 'Share' | Carrois Apostrophe |
| `jetbrains-mono.woff2` | JetBrains Mono | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | JetBrains; Philipp Nurullin; Konstantin Bulenkov |

OFL 1.1 の全文: https://openfontlicense.org/open-font-license-official-text/

各フォントの OFL.txt 原文:

- https://github.com/google/fonts/blob/main/ofl/orbitron/OFL.txt
- https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt
- https://github.com/google/fonts/blob/main/ofl/outfit/OFL.txt
- https://github.com/google/fonts/blob/main/ofl/cormorantgaramond/OFL.txt
- https://github.com/google/fonts/blob/main/ofl/bebasneue/OFL.txt
- https://github.com/google/fonts/blob/main/ofl/sharetechmono/OFL.txt
- https://github.com/google/fonts/blob/main/ofl/jetbrainsmono/OFL.txt

## 日本語の扱い

`fonts.css` の各 `@font-face` には `unicode-range` を残しています。
そのため日本語や latin-ext の文字は同梱フォントを使わず、端末のシステムフォントで描画されます
（日本語グリフを含まないため、同梱しても意味がない）。

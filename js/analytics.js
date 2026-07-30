/*
 * Google Analytics 4（gtag.js）の読み込み。
 *
 * 14ページに同じスニペットを貼ると測定IDの変更漏れが起きるので、
 * 1ファイルにまとめて各ページから読み込む。
 *
 * 送信しない条件:
 *   - デスクトップ版（Tauri）: ローカルのアセットを開いているだけなので計測対象外
 *   - ローカル開発（localhost / 127.0.0.1 / file://）: 開発中のアクセスで
 *     本番のレポートを汚さないため
 *
 * gtag.js は async で読み込むのでレンダリングはブロックしない。
 */
(function () {
  var MEASUREMENT_ID = 'G-SJ2XB775N9';

  // デスクトップアプリ版では計測しない
  if (window.__TAURI_INTERNALS__ || window.__TAURI__) return;

  // ローカル開発では計測しない（file:// は hostname が空文字になる）
  var host = location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };

  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  document.head.appendChild(script);
})();

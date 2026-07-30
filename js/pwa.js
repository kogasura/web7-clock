/*
 * Service Worker の登録。
 *
 * Web版だけで動かす:
 *   - デスクトップ版（Tauri）はローカルアセットを直接読むので登録しない
 *   - Service Worker は https か localhost でしか動かないため、
 *     file:// で開いた場合も何もしない
 *
 * 登録は load 後に回して初期表示の邪魔をしない。
 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (window.__TAURI_INTERNALS__ || window.__TAURI__) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {
      // 登録できなくても通常表示に影響はないので黙って諦める
    });
  });
})();

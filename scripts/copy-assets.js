/**
 * Copy web assets to dist/ for Tauri bundling.
 * Only copies the clock-related files, excluding src-tauri, node_modules, etc.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const INCLUDE = ['clocks', 'css', 'js', 'images', 'index.html', 'desktop'];
const EXCLUDE = new Set(['node_modules', 'src-tauri', 'dist', 'scripts', '.git', 'target', 'app-icon.png']);

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (EXCLUDE.has(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Clean and recreate dist
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

for (const item of INCLUDE) {
  const src = path.join(ROOT, item);
  const dest = path.join(DIST, item);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
  }
}

console.log('Assets copied to dist/');

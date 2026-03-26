/**
 * Copy web assets to dist/ for Tauri bundling.
 * Only copies the clock-related files, excluding src-tauri, node_modules, etc.
 * Injects transparent background CSS into clock HTML files for desktop transparency support.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const INCLUDE = ['clocks', 'css', 'js', 'images', 'index.html', 'desktop'];
const EXCLUDE = new Set(['node_modules', 'src-tauri', 'dist', 'scripts', '.git', 'target', 'app-icon.png']);

// Clocks that support transparent backgrounds
const TRANSPARENT_CLOCKS = new Set([
  'neon', 'minimal', 'retro', 'matrix', 'gradient',
  'flip', 'cyber', 'terminal', 'glass'
]);

const TRANSPARENT_CSS = '<style id="desktop-transparent">html,body{background:transparent!important}.clock-container{background:transparent!important}</style>';

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

/**
 * Inject transparent CSS into clock HTML files.
 * Inserts a <style> tag right after <head> so it takes effect before any other styles.
 */
function injectTransparentCSS(distDir) {
  for (const clockId of TRANSPARENT_CLOCKS) {
    const htmlPath = path.join(distDir, 'clocks', clockId, 'index.html');
    if (!fs.existsSync(htmlPath)) continue;

    let html = fs.readFileSync(htmlPath, 'utf-8');
    // Insert transparent CSS right after <head> tag
    html = html.replace(/<head>/i, '<head>' + TRANSPARENT_CSS);
    fs.writeFileSync(htmlPath, html, 'utf-8');
  }
  console.log('Transparent CSS injected into clock HTML files');
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

// Inject transparent CSS into copied clock HTML files
injectTransparentCSS(DIST);

console.log('Assets copied to dist/');

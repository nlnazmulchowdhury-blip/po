/**
 * copy-unaux-deploy.js
 * Copies the Next.js static export ("out" folder) to a new
 * "goozoo-deploy" folder on the Desktop, ready to upload via FTP
 * to goozoo.unaux.com
 */

const fs   = require('fs');
const path = require('path');

const OUT_DIR    = path.resolve(__dirname, '..', 'out');
const DESKTOP    = path.join(require('os').homedir(), 'OneDrive', 'Desktop');
const DEPLOY_DIR = path.join(DESKTOP, 'goozoo-deploy');

console.log('📦 Copying build output to Desktop/goozoo-deploy ...\n');

// Make sure out/ exists
if (!fs.existsSync(OUT_DIR)) {
  console.error('❌  "out" folder not found. Run "npm run build:unaux" first.');
  process.exit(1);
}

// Remove old deploy folder if present
if (fs.existsSync(DEPLOY_DIR)) {
  fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
  console.log('🗑  Removed old deploy folder.');
}

// Recursive copy helper
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(OUT_DIR, DEPLOY_DIR);

console.log(`✅  Deploy folder created at:\n    ${DEPLOY_DIR}`);
console.log('\n🚀 Upload the contents of this folder to the root of goozoo.unaux.com via FTP.');
console.log('   FTP host : goozoo.unaux.com');
console.log('   Upload   : ALL files/folders inside goozoo-deploy → public_html/');

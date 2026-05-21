/**
 * build-unaux.js
 * Builds the Next.js app as a fully static export for goozoo.unaux.com
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

console.log('🔨 Building for Unaux static hosting (goozoo.unaux.com)...\n');

// Set env and run build
try {
  execSync('next build', {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      UNAUX_STATIC_EXPORT: 'true',
    },
  });
  console.log('\n✅ Build completed! Static files are in the "out" folder.');
} catch (err) {
  console.error('\n❌ Build failed:', err.message);
  process.exit(1);
}

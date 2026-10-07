import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * After the build, inject the full list of emitted files into docs/sw.js
 * so the service worker can precache the whole app for offline use.
 * Also stamps a build version so old caches are cleaned up on update.
 */
// Built app goes to /docs so GitHub Pages can serve it directly
// (Settings → Pages → Deploy from a branch → main → /docs).
const OUT_DIR = 'docs';

function precacheManifest() {
  return {
    name: 'precache-manifest',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(OUT_DIR);
      const swPath = path.join(dist, 'sw.js');
      if (!fs.existsSync(swPath)) return;
      const files = [];
      const walk = (dir) => {
        for (const f of fs.readdirSync(dir)) {
          const full = path.join(dir, f);
          if (fs.statSync(full).isDirectory()) walk(full);
          else {
            const rel = path.relative(dist, full).split(path.sep).join('/');
            if (rel === 'sw.js' || rel.endsWith('.map') || rel.startsWith('splash/')) continue;
            files.push('./' + rel);
          }
        }
      };
      walk(dist);
      files.push('./');
      const version = Date.now().toString(36);
      const sw = fs
        .readFileSync(swPath, 'utf8')
        .replace('self.__PRECACHE__', JSON.stringify(files))
        .replace('__BUILD_VERSION__', version);
      fs.writeFileSync(swPath, sw);
      console.log(`[precache] ${files.length} files, version ${version}`);
    },
  };
}

export default defineConfig({
  // Relative base so the build works on GitHub Pages sub-paths and any static host.
  base: './',
  plugins: [react(), precacheManifest()],
  build: { outDir: OUT_DIR, emptyOutDir: true, sourcemap: false },
});

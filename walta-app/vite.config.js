const { defineConfig } = require('vite');
const { readdirSync } = require('fs');
const { join } = require('path');

// Build list of alloy virtual module URLs to pre-warm.
// Controllers, models, and styles are served as ?import virtual modules
// by the liveview alloy plugin and are not covered by file-based warmup.
function alloyVirtualUrls(appDir) {
  const urls = [];
  const dirs = [
    ['controllers', 'alloy/controllers'],
    ['styles', 'alloy/styles'],
  ];
  for (const [srcDir, urlPrefix] of dirs) {
    const fullDir = join(appDir, srcDir);
    let files;
    try { files = readdirSync(fullDir); } catch { continue; }
    for (const f of files) {
      if (f.endsWith('.js') || f.endsWith('.xml')) {
        urls.push(`/${urlPrefix}/${f.replace(/\.(js|xml)$/, '')}?import`);
      }
    }
  }
  return urls;
}

// Spec files are required by the test runner via bare module IDs (no .js extension),
// which vite serves at /@id/spec/<name> — a different cache entry from the file path.
function specModuleIdUrls(specDir) {
  let files;
  try { files = readdirSync(specDir); } catch { return []; }
  return files
    .filter(f => f.endsWith('.js'))
    .map(f => `/@id/spec/${f.replace(/\.js$/, '')}`);
}

module.exports = defineConfig({
  logLevel: 'info',
  server: {
    warmup: {
      clientFiles: [
        './spec/**/*.js',
        './lib/**/*.js',
        './controllers/**/*.js',
      ]
    }
  },
  plugins: [
    {
      name: 'alloy-warmup',
      configureServer(server) {
        let warmupPromise = null;

        server.httpServer?.once('listening', () => {
          const appDir = join(__dirname, 'app');
          const urls = [
            ...alloyVirtualUrls(appDir),
            ...specModuleIdUrls(join(appDir, 'spec')),
          ];
          console.log(`[vite] Pre-warming ${urls.length} alloy/spec modules...`);
          warmupPromise = Promise.all(urls.map(url =>
            server.transformRequest(url).catch(() => {})
          )).then(() => {
            console.log('[vite] Warmup complete');
          });
        });

        // Hold all incoming requests until warmup is done so the device
        // never blocks on a cold transform (which would stall the main thread
        // long enough to trigger the iOS watchdog).
        server.middlewares.use((_req, _res, next) => {
          if (warmupPromise) {
            warmupPromise.then(next);
          } else {
            next();
          }
        });
      }
    },
    {
      name: 'request-logger',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          console.log(`[vite] ${req.method} ${req.url}`);
          next();
        });
      }
    }
  ]
});

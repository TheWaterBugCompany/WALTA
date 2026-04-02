const { defineConfig } = require('vite');
const { readdirSync } = require('fs');
const { join } = require('path');
const http = require('http');

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

// Spec files are required by the test runner via bare module IDs (no .js
// extension), which liveview serves at /@id/spec/<name>.  These go through
// liveview middleware, so we must warm them with real HTTP requests rather
// than server.transformRequest() which bypasses middleware.
function specModuleIdUrls(specDir) {
  let files;
  try { files = readdirSync(specDir); } catch { return []; }
  return files
    .filter(f => f.endsWith('.js'))
    .map(f => `/@id/spec/${f.replace(/\.js$/, '')}`);
}

// Collect all .js files under a directory tree as URL paths relative to the
// app root.  These are fetched via HTTP to warm liveview's transform cache
// so the device never blocks on a cold transform.
function collectJsUrls(baseDir, urlPrefix) {
  const { readdirSync: rd, statSync } = require('fs');
  const urls = [];
  function walk(dir, rel) {
    let entries;
    try { entries = rd(dir); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e);
      const relPath = rel ? `${rel}/${e}` : e;
      try {
        if (statSync(full).isDirectory()) {
          walk(full, relPath);
        } else if (e.endsWith('.js')) {
          urls.push(`/${urlPrefix}/${relPath}`);
        }
      } catch { /* skip unreadable */ }
    }
  }
  walk(baseDir, '');
  return urls;
}

// Fetch a URL from the local vite server via HTTP — this goes through the
// full middleware stack including liveview's resolve plugin.
const WARMUP_HEADER = 'x-vite-warmup';
function fetchLocal(host, port, urlPath) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: host,
      port,
      path: urlPath,
      headers: { [WARMUP_HEADER]: '1' },
    }, (res) => {
      if (res.statusCode !== 200) {
        console.log(`[vite] Warmup HTTP ${res.statusCode}: ${urlPath}`);
      }
      res.resume();
      res.on('end', resolve);
    });
    req.on('error', (err) => {
      console.log(`[vite] Warmup fetch error: ${urlPath} - ${err.message}`);
      resolve();
    });
    req.setTimeout(10000, () => {
      console.log(`[vite] Warmup fetch timeout: ${urlPath}`);
      req.destroy();
      resolve();
    });
  });
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
        let warmupDone = false;

        server.httpServer?.once('listening', async () => {
          // Small delay to ensure the server is actually accepting connections
          await new Promise(r => setTimeout(r, 500));

          const addr = server.httpServer.address();
          const host = typeof addr === 'object' ? (addr.address === '::' || addr.address === '0.0.0.0' ? '127.0.0.1' : addr.address) : '127.0.0.1';
          const port = typeof addr === 'object' ? addr.port : addr;
          const appDir = join(__dirname, 'app');
          const alloyUrls = alloyVirtualUrls(appDir);
          const specUrls = specModuleIdUrls(join(appDir, 'spec'));
          const libUrls = collectJsUrls(join(appDir, 'lib'), 'lib')
            .filter(u => !u.includes('/lib/spec/')); // skip spec symlink
          const specHelperUrls = [
            ...collectJsUrls(join(appDir, 'spec', 'mocks'), 'spec/mocks'),
            ...collectJsUrls(join(appDir, 'spec', 'util'), 'spec/util'),
            ...collectJsUrls(join(appDir, 'spec', 'fixtures'), 'spec/fixtures'),
            ...collectJsUrls(join(appDir, 'spec', 'lib'), 'spec/lib'),
          ];
          const httpUrls = [...alloyUrls, ...specUrls, ...libUrls, ...specHelperUrls];

          console.log(`[vite] Pre-warming ${httpUrls.length} modules via HTTP at ${host}:${port} (${alloyUrls.length} alloy, ${specUrls.length} spec, ${libUrls.length} lib, ${specHelperUrls.length} helpers)...`);

          // Warm everything via HTTP in batches — too many concurrent
          // requests can overwhelm the server and cause silent failures.
          const BATCH_SIZE = 20;
          const httpWarmup = (async () => {
            for (let i = 0; i < httpUrls.length; i += BATCH_SIZE) {
              const batch = httpUrls.slice(i, i + BATCH_SIZE);
              await Promise.all(batch.map(url =>
                fetchLocal(host, port, url).catch(() => {})
              ));
            }
          })();

          let timer;
          const timeout = new Promise(resolve => {
            timer = setTimeout(() => {
              console.log('[vite] Warmup timed out after 30s, proceeding');
              resolve();
            }, 30000);
          });

          await Promise.race([
            httpWarmup.then(() => {
              clearTimeout(timer);
              console.log('[vite] Warmup complete');
            }),
            timeout
          ]);

          warmupDone = true;
        });

        // Hold all incoming device requests until warmup is done so the
        // device never blocks on a cold transform (which would stall the
        // main thread long enough to trigger the iOS 0x8BADF00D watchdog).
        server.middlewares.use((req, _res, next) => {
          // Don't block our own warmup fetches (tagged with custom header)
          if (warmupDone || req.headers[WARMUP_HEADER]) {
            next();
          } else {
            const check = setInterval(() => {
              if (warmupDone) {
                clearInterval(check);
                next();
              }
            }, 100);
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

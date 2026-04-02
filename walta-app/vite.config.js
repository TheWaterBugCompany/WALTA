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

// Fetch a URL from the local vite server via HTTP — this goes through the
// full middleware stack including liveview's resolve plugin.
function fetchLocal(port, urlPath) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}${urlPath}`, (res) => {
      res.resume();
      res.on('end', resolve);
    });
    req.on('error', resolve); // swallow errors, best-effort warmup
    req.setTimeout(10000, () => { req.destroy(); resolve(); });
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
          const addr = server.httpServer.address();
          const port = typeof addr === 'object' ? addr.port : addr;
          const appDir = join(__dirname, 'app');
          const alloyUrls = alloyVirtualUrls(appDir);
          const specUrls = specModuleIdUrls(join(appDir, 'spec'));
          const allUrls = [...alloyUrls, ...specUrls];

          console.log(`[vite] Pre-warming ${allUrls.length} modules (${alloyUrls.length} alloy + ${specUrls.length} spec)...`);

          // Warm alloy virtual modules via transformRequest (these work)
          const alloyWarmup = Promise.all(alloyUrls.map(url =>
            server.transformRequest(url).catch(err => {
              console.log(`[vite] Alloy warmup failed: ${url} - ${err.message}`);
            })
          ));

          // Warm spec /@id/ modules via HTTP (goes through liveview middleware)
          const specWarmup = Promise.all(specUrls.map(url =>
            fetchLocal(port, url).catch(() => {})
          ));

          const timeout = new Promise(resolve => setTimeout(() => {
            console.log('[vite] Warmup timed out after 30s, proceeding');
            resolve();
          }, 30000));

          await Promise.race([
            Promise.all([alloyWarmup, specWarmup]).then(() => {
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
          // Don't block our own warmup fetches (from 127.0.0.1)
          if (warmupDone || (req.socket.remoteAddress === '127.0.0.1' || req.socket.remoteAddress === '::1')) {
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

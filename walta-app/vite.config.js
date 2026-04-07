const { defineConfig } = require('vite');

module.exports = defineConfig({
  logLevel: 'info',
  plugins: [
    {
      name: 'request-logger',
      configureServer(server) {
        if (process.env.VITE_LOG_LEVEL === 'trace') {
          server.middlewares.use((req, _res, next) => {
            console.log(`[vite] ${req.method} ${req.url}`);
            next();
          });
        }
      }
    }
  ]
});

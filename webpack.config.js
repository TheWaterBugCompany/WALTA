const path = require('path');
const webpack = require('webpack');

module.exports = [
  {
    mode: 'development',
    devtool: 'source-map',
    entry: './node_modules/mocha/index.js',
    output: {
        path: path.resolve(__dirname,'walta-app/app/assets/unit-test/lib'),
        library: {
            name: 'Mocha',
            type: 'commonjs2'
        },
        filename: 'mocha.js'
    },
    resolve: {
        descriptionFiles:["package.json"],
        alias: {
            "./browser-entry.js": path.resolve(__dirname,'mocha-bootstrap.js'),
            "stream": false
        },
        fallback: {
            "events": require.resolve("events/"),
            "path": require.resolve("path-browserify"),
            "util": require.resolve("util/"),
            "fs": false,
            "os": false,
            "url": false,
            "assert": false,
        }
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
            resource.request = resource.request.replace(/^node:/, '');
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
          })
    ]
  },
  {
    mode: 'development',
    entry: './node_modules/chai/index.js',
    output: {
        path: path.resolve(__dirname,'walta-app/app/assets/unit-test/lib'),
        library: {
            name: 'chai',
            type: 'commonjs2'
        },
        filename: 'chai.js'
    }
  }
];
  
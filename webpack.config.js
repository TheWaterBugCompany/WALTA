const path = require('path');
const webpack = require('webpack');
module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: './node_modules/mocha/index.js',
    output: {
        path: path.resolve(__dirname,'walta-app/app/lib/spec/lib'),
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
            "events": require.resolve('events'),
            "util": require.resolve('util/'),
            "path": false,
            "fs": false
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
          }),
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
            resource.request = resource.request.replace(/^node:/, '');
        })
    ]

  };
  
const path = require('path');
const webpack = require('webpack');
module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        mocha: './node_modules/mocha/index.js',
        chai: './node_modules/chai/index.js',
    },
    output: {
        path: path.resolve(__dirname,'walta-app/app/spec/lib'),
        library: {
            type: 'commonjs2'
        },
        filename: '[name].js'
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
  
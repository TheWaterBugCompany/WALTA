#! /usr/local/bin/node
var fs = require('fs');
var CircularJSON = require('circular-json');
var KeyLoader = require("logic/KeyLoaderInk");
var key = KeyLoader.loadKey( '../walta-app/app/assets/taxonomy/walta/', '/taxonomy/walta' );
console.log( `writing file walta/key.json`);
fs.writeFileSync( 'walta/key.json', CircularJSON.stringify(key) );

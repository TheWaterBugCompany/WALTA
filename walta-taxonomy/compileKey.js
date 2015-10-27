#! /usr/bin/nodejs
var fs = require('fs');
var CircularJSON = require('circular-json');
var KeyLoader = require("logic/KeyLoaderXml");
var key = KeyLoader.loadKey( 'taxonomy/walta/' );
fs.writeFileSync( 'walta/key.json', CircularJSON.stringify(key) );



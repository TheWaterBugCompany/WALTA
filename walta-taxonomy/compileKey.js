#! /usr/bin/node
var fs = require('fs');
var CircularJSON = require('circular-json');
var KeyLoader = require("logic/KeyLoaderXml");
var key = KeyLoader.loadKey( '../walta-app/app/assets/taxonomy/walta/' );
fs.writeFileSync( '../walta-app/app/assets/taxonomy/walta/key.json', CircularJSON.stringify(key) );

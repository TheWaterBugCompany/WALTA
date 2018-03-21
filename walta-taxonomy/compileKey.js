#! /usr/bin/node
var fs = require('fs');
var CircularJSON = require('circular-json');
var KeyLoader = require("../walta-app/app/lib/logic/KeyLoaderXml");
var key = KeyLoader.loadKey( './app/assets/taxonomy/walta/' );
fs.writeFileSync( './app/assets/taxonomy/walta/key.json', CircularJSON.stringify(key) );

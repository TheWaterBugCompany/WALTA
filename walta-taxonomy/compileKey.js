#! /usr/bin/node
var fs = require('fs');
var CircularJSON = require('circular-json');
var KeyLoader = require("logic/KeyLoaderXml");

var key = KeyLoader.loadKey( '../walta-app/app/assets/taxonomy/walta/', '/taxonomy/walta' );
fs.writeFileSync( 'walta/key.json', CircularJSON.stringify(key) );

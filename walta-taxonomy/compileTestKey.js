#! /usr/bin/node
var fs = require('fs');
var CircularJSON = require('circular-json');
var KeyLoader = require("../walta-app/app/lib/logic/KeyLoaderXml");
var key = KeyLoader.loadKey( './app/specs/resources/simpleKey1/' );
fs.writeFileSync( './app/specs/resources/simpleKey1/key.json', CircularJSON.stringify(key) );

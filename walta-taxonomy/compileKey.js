//npm install -g xmldom circular-json
//export NODE_PATH=./:$HOME/.npm-packages/lib/node_modules:$NODE_PATH

var fs = require('fs');
var CircularJSON = require('circular-json');
var KeyLoader = require("logic/KeyLoaderXml");
var key = KeyLoader.loadKey( 'taxonomy/walta/' );
fs.writeFileSync( 'taxomony/walta/kay.json', CircularJSON.stringify(key) );



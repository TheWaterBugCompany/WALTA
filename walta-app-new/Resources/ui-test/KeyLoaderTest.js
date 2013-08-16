var Key = require('logic/Key');
var KeyLoaderXml = require('logic/KeyLoaderXml');

function run() {
	key = KeyLoaderXml.loadKey( 'ui-test/resources/simpleKey1' );
}
exports.run = run;
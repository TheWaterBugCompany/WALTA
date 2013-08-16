var _ = require('lib/underscore')._;

var Key = require('logic/Key');
var Question = require('logic/Question');
var Taxon = require('logic/Taxon');
var KeyLoaderXml = require('logic/KeyLoaderXml');

describe('KeyLoaderXml', function() {
	var key;
	it('should load a key from XML', function(){
		key = KeyLoaderXml.loadKey( 'ui-test/resources/simpleKey1' );
		expect( key ).toBeDefined();
	});
});
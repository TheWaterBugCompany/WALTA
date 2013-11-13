require("spec/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');

var _ = require('lib/underscore')._;

var KeyLoaderXml = require('logic/KeyLoaderXml');
var SpeedbugView = require('ui/SpeedbugView');

describe('SpeedbugView', function() {
	var bv, win, key;
	key = KeyLoaderXml.loadKey( Ti.Filesystem.resourcesDirectory, 'spec/resources/simpleKey1' );
	sb = SpeedbugView.createSpeedbugView( key );
	win = TestUtils.wrapViewInWindow( sb.view );

	it('should display the speed bug window', function() {
		TestUtils.windowOpenTest( win ); 
	});
	
	TestUtils.closeWindow( win );
});
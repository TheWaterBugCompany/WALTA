require("spec/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');

var _ = require('lib/underscore')._;

var KeyLoaderXml = require('logic/KeyLoaderXml');
var BrowseView = require('ui/BrowseView');

describe('BrowseView', function() {
	var bv, win, key;
	key = KeyLoaderXml.loadKey( Ti.Filesystem.resourcesDirectory, '/spec/resources/simpleKey1' );
	bv = BrowseView.createBrowseView( key );
	win = TestUtils.wrapViewInWindow( bv.view );

	it('should display the browse view window', function() {
		TestUtils.windowOpenTest( win ); 
	});
	
	TestUtils.closeWindow( win );
});
require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var KeyLoaderJson = require('logic/KeyLoaderJson');
var { closeWindow, controllerOpenTest } = require("spec/util/TestUtils");

describe('TaxonList controller', function() {
	var key, ctl;
	before( function(){
		key = KeyLoaderJson.loadKey( Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/' );
		ctl = Alloy.createController("TaxonList", { key: key });
	});

	after( function() {
		closeWindow( ctl.getView() );
	});

	it('should display the browse view window', function(done) {
		controllerOpenTest( ctl, done );
	});

});

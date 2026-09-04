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

// Browsing is a way into an identification, so the list offers a way back to the
// tray it was reached from — and none when it was reached from the menu.
describe('TaxonList tray button', function() {
	var key, ctl;
	before( function(){
		key = KeyLoaderJson.loadKey( Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/' );
	});

	function trayButton(c) {
		return c.getAnchorBar().rightTools.children.find( function(child) {
			return child.image === '/images/icon-icecube-white.png';
		});
	}

	function open(args) {
		return new Promise( function(resolve) {
			ctl = Alloy.createController("TaxonList", _({ key: key }).extend(args || {}));
			controllerOpenTest( ctl, resolve );
		});
	}

	afterEach( function() { closeWindow( ctl.getView() ); });

	it('offers a way back to the tray the identification started from', async function() {
		await open({ allowAddToSample: true });
		expect( trayButton( ctl ).visible ).to.equal( true );
	});

	it('offers none when the list was not reached from a tray', async function() {
		await open({ allowAddToSample: false });
		expect( trayButton( ctl ).visible ).to.equal( false );
	});
});

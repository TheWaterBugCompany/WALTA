require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var Topics = require('ui/Topics');
var { checkTestResult, setManualTests, actionFiresTopicTest, closeWindow, controllerOpenTest } = require('spec/util/TestUtils');
var { speedBugIndexMock } = require('spec/mocks/MockSpeedbug');
var { keyMock } = require('spec/mocks/MockKey');
keyMock.addSpeedbugIndex( speedBugIndexMock );
Alloy.Globals.Key = keyMock;
describe('Speedbug controller', function() {
	var SpeedBug;
	beforeEach( function() {
		SpeedBug = Alloy.createController("Speedbug", { key: keyMock });
	});

	afterEach( function() {
		closeWindow( SpeedBug.getView() );
	});

	it('should display the speed bug window', function(done) {
		controllerOpenTest( SpeedBug, done );
	});

	it('should link to correct taxon node when a speed bug is selected', function(done) {
		SpeedBug.on("rendered", function() {
			var tiles = SpeedBug.getSpeedbugTiles().tiles;
			actionFiresTopicTest( tiles[0].SpeedbugTile, 'click', Topics.JUMPTO, function(data) {
				 expect( data.id ).to.equal('aeshnidae_telephleb');
				 done();
			});
		})
		controllerOpenTest( SpeedBug, function() {} );
	});

	it('should link to correct key node when a not sure link is selected', function(done) {
		SpeedBug.on("rendered", function() {
			var group = SpeedBug.getSpeedbugGroups()[0];
			actionFiresTopicTest( group.notSureButton, 'click', Topics.JUMPTO, function(data) {
				expect( data.id ).to.equal('group1');
				done();
			});
		})
		controllerOpenTest( SpeedBug, function() {});
	});
});

// Speedbug is a way into an identification, so it offers a way back to the tray
// it was reached from — and none when it was reached from the menu.
describe('Speedbug tray button', function() {
	var ctl;

	function trayButton(c) {
		return c.getAnchorBar().rightTools.children.find( function(child) {
			return child.image === '/images/icon-icecube-white.png';
		});
	}

	function open(args) {
		return new Promise( function(resolve) {
			ctl = Alloy.createController("Speedbug", _({ key: keyMock }).extend(args || {}));
			controllerOpenTest( ctl, resolve );
		});
	}

	afterEach( function() { closeWindow( ctl.getView() ); });

	it('offers a way back to the tray the identification started from', async function() {
		await open({ allowAddToSample: true });
		expect( trayButton( ctl ).visible ).to.equal( true );
	});

	it('offers none when speedbug was not reached from a tray', async function() {
		await open({ allowAddToSample: false });
		expect( trayButton( ctl ).visible ).to.equal( false );
	});
});

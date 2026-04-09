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

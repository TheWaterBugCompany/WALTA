/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require("specs/lib/ti-mocha");
var { expect } = require('specs/lib/chai');
var Topics = require('ui/Topics');
var { checkTestResult, actionFiresTopicTest, closeWindow, controllerOpenTest } = require('specs/util/TestUtils');
var { speedBugIndexMock } = require('specs/mocks/MockSpeedbug');
var { keyMock } = require('specs/mocks/MockKey');
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
		controllerOpenTest( SpeedBug, function() {
			var tile = SpeedBug.getSpeedbugTiles().tiles[0];
			actionFiresTopicTest( tile.SpeedbugTile, 'click', Topics.JUMPTO, function(data) {
				 expect( data.id ).to.equal('aeshnidae_telephleb');
				 done();
			});
		} );
	});

	it('should link to correct key node when a not sure link is selected', function(done) {
		controllerOpenTest( SpeedBug, function() {
			var group = SpeedBug.getSpeedbugGroups()[0];
			actionFiresTopicTest( group.notSureButton, 'click', Topics.JUMPTO, function(data) {
				expect( data.id ).to.equal('group1');
				done();
			});
		});
	});
});

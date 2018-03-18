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
var TestUtils = require('specs/util/TestUtils');

var AnchorBar = require('ui/AnchorBar');
var Topics = require('ui/Topics');

describe('AnchorBar', function() {
	var acb, win;


	acb = AnchorBar.createAnchorBar();
	win = TestUtils.wrapViewInWindow( acb.view );

	it('should display an anchor bar at the top of the screen', function() {
		TestUtils.windowOpenTest( win );
	});

	it('should fire the HOME event when the home button is clicked', function() {
		TestUtils.actionFiresTopicTest( acb._views.home, 'click', Topics.HOME );
	});

	// it('should fire the SETTINGS event when the settings button is clicked', function() {
		// TestUtils.actionFiresTopicTest( acb._views.settings, 'click', Topics.SETTINGS );
	// });
//
	// it('should fire the INFO event when the settings button is clicked', function() {
		// TestUtils.actionFiresTopicTest( acb._views.info, 'click', Topics.INFO );
	// });

	TestUtils.closeWindow( win );
});

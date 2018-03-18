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
require("specs/lib/ti-mocha").infect(this);
var TestUtils = require('util/TestUtils');
var AppWindow = require('control/AppWindow');

var Topics = require('ui/Topics');

describe('AppWindow', function() {
	var app;

	beforeEach( function() {
		runs( function() {
			app = AppWindow.createAppWindow( 'simpleKey1', Ti.Filesystem.resourcesDirectory + 'specs/resources/' );
			app.start();
		});

		waitsFor( function() {
			return app.getCurrentWindow();
		}, "waiting for app to start", 750);
	});



	it('should open the main window after start() is called', function() {
		runs( function() {
			expect( app.getCurrentWindow().name ).toEqual('home');
			TestUtils.closeWindow( app.getCurrentWindow().window );
		});
	});

	it('should open the decision window when key search is started', function(){
		TestUtils.actionFiresTopicTest(
			app.getCurrentWindow().uiObj._views.keysearch, 'click', Topics.KEYSEARCH
		);
		runs( function() {
			expect( app.getCurrentWindow().name ).toEqual('decision');
			TestUtils.closeWindow( app.getCurrentWindow().window );
		} );
	});

	// TODO: Check details of decision screen
	// TODO: Test question selection
	// TODO: Test back
	// TODO: Test navigation to Taxon node
	// TODO: Test back from Taxon node


});

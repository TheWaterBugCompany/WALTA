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
require("unit-test/lib/ti-mocha");
var { expect } = require("unit-test/lib/chai");
var { closeWindow, controllerOpenTest, actionFiresTopicTest, clickButton } = require("unit-test/util/TestUtils");
var Topics = require("ui/Topics");
var CerdiApi = require("unit-test/mocks/MockCerdiApi");
Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
describe.only('Menu controller', function() {
	var mnu;
	beforeEach( function( done ) {
		mnu = Alloy.createController("Menu", {unknown_bug:true});
		controllerOpenTest( mnu, done );
	});
	afterEach( function(done) {
		closeWindow( mnu.getView(), done );
	}); 

	it('should fire the DETAILED topic', function(done) {
		actionFiresTopicTest( mnu.detailed, 'click', Topics.DETAILED, () => done() );
	});

	it('should fire the GALLERY topic', function(done) {
		actionFiresTopicTest( mnu.gallery, 'click', Topics.GALLERY, () => done() );
	});

	it('should fire the ABOUT topic', function(done) {
		actionFiresTopicTest( mnu.about, 'click', Topics.ABOUT, () => done() );
	});

	it('should fire the KEYSEARCH topic', function(done) {
		clickButton( mnu.identify );
		Topics.subscribe(Topics.KEYSEARCH, () => done() );
		mnu.selectMethod.trigger("keysearch");
	});

	it('should fire the SPEEDBUG topic', function(done) {
		clickButton( mnu.identify );
		Topics.subscribe(Topics.SPEEDBUG, () => done() );
		mnu.selectMethod.trigger("speedbug");
	});

	it('should fire the BROWSE topic', function(done) {
		clickButton( mnu.identify );
		Topics.subscribe(Topics.BROWSE, () => done()  );
		mnu.selectMethod.trigger("browselist");
	});

});

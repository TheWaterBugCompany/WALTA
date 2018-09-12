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
var { expect } = require("specs/lib/chai");
var { closeWindow, controllerOpenTest, actionFiresTopicTest } = require("specs/util/TestUtils");
var Topics = require("ui/Topics");
var CerdiApi = require("specs/mocks/MockCerdiApi");
Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
describe('Menu controller', function() {
	var mnu;
	before( function() {
		mnu = Alloy.createController("Menu");
	});
	after( function(done) {
		closeWindow( mnu.getView(), done );
	});
	it('should display the menu view', function(done) {
		this.timeout(3000);
		controllerOpenTest( mnu, done );
	});


	it('should fire the MAYFLY topic', function(done) {
		actionFiresTopicTest( mnu.mayfly, 'click', Topics.MAYFLY, done );
	});

	it('should fire the DETAILED topic', function(done) {
		actionFiresTopicTest( mnu.detailed, 'click', Topics.DETAILED, done );
	});

	it('should fire the BROWSE topic', function(done) {
		actionFiresTopicTest( mnu.browse, 'click', Topics.BROWSE, done );
	});

	it('should fire the HELP topic', function(done) {
		actionFiresTopicTest( mnu.help, 'click', Topics.HELP, done );
	});

	it('should fire the GALLERY topic', function(done) {
		actionFiresTopicTest( mnu.gallery, 'click', Topics.GALLERY, done );
	});

	it('should fire the ABOUT topic', function(done) {
		actionFiresTopicTest( mnu.about, 'click', Topics.ABOUT, done );
	});


});
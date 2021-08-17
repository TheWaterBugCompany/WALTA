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
var { expect } = require('unit-test/lib/chai');
var { wrapViewInWindow, setManualTests, closeWindow, windowOpenTest, waitForEvent } = require('unit-test/util/TestUtils');
var Topics = require('ui/Topics');

describe('MethodSelect', function() { 
	var mnu, win;
	before( function(done) {
		this.timeout(3000);
		mnu = Alloy.createController("MethodSelect");
		win = wrapViewInWindow( mnu.getView() );
		windowOpenTest( win, done );
	});

	after( function(done) {
		closeWindow( win, done );
	});

	it('should fire the keysearch event', function(done) {
		mnu.on("keysearch", function event() {
			mnu.off("keysearch",event);
			done();
		});
		mnu.keysearch.trigger("click");
	});

	it('should fire the speedbug event', function(done) {
		mnu.on("speedbug", function event() {
			mnu.off("speedbug",event);
			done();
		});
		mnu.speedbug.trigger("click");
	});

	it('should fire the browse event', function(done) {
		mnu.on("browselist", function event() {
			mnu.off("browselist",event);
			done();
		});
		mnu.browselist.trigger("click");
	});

	it.only('should add an unknown bug', function(done) {
		mnu.on("unknownbug", function event() {
			mnu.off("unknownbug",event);
			done();
		});
		mnu.unknownbug.trigger("click");
	});

});

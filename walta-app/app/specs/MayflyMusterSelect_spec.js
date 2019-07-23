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
var { wrapViewInWindow, setManualTests, closeWindow, windowOpenTest, waitForEvent } = require('specs/util/TestUtils');
var Topics = require('ui/Topics');

describe('MayflyMusterSelect', function() { 
	var mnu, win;
	before( function() {
		mnu = Alloy.createController("MayflyMusterSelect");
		win = wrapViewInWindow( mnu.getView() );
	});

	after( function(done) { 
		closeWindow( win, done );
	});

	it('should open menu', function(done) { 
		windowOpenTest( win, done );
	});

});

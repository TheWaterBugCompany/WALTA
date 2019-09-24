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
var mocx = require("unit-test/lib/mocx");
var { closeWindow, controllerOpenTest, setManualTests } = require("unit-test/util/TestUtils");

describe("Habitat controller", function() {
    var ctl;
	beforeEach( function() {
        mocx.createModel("sample");
		ctl = Alloy.createController("Habitat");
	});
	afterEach( function(done) {
		closeWindow( ctl.getView(), done );
	});
	it('should display the Habitat view', function(done) { 
		controllerOpenTest( ctl, done );
    });
    it('should enable the next button when habitat totals 100%', function(done) { 
		controllerOpenTest( ctl, done );
    });
});
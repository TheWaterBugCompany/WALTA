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
var { closeWindow, controllerOpenTest } = require("unit-test/util/TestUtils");
describe.only("Notes controller", function() {
	var ctl;
	beforeEach( function() {
		ctl = Alloy.createController("Notes");
	});
	afterEach( function(done) {
		closeWindow( ctl.getView(), done );
	});
	it.only('should display the Notes view', async function() {
		await controllerOpenTest( ctl );
  });
  it('should bind the partial summision checkbox to the partial field in the sample');
  it('should bind the notes field to the notes field in the sample model');
  it('should move from the sample tray to the notes screen');
  it('should move from the notes screen to the summary screen');
});
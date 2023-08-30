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
describe("About controller", function() {
	var ctl;
	beforeEach( function() {
		ctl = Alloy.createController("About", { keyUrl: Ti.Filesystem.resourcesDirectory + "taxonomy/walta/" });
	});
	afterEach( function(done) {
		closeWindow( ctl.getView(), done );
	});
	it('should display the About view', async function() {
		await controllerOpenTest( ctl );
  });
});
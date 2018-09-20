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
var { closeWindow, controllerOpenTest } = require("specs/util/TestUtils");
var mocx = require("specs/lib/mocx");

describe.only("SiteDetails controller", function() {
	var ctl;
	before( function() {
        mocx.createModel("sample");
        Alloy.Models.sample.set("surveyType", 2);
		ctl = Alloy.createController("SiteDetails");
	});
	after( function(done) {
		closeWindow( ctl.getView(), done );
	});
	it('should display the SiteDetails view', function(done) {
		controllerOpenTest( ctl, done );
    });
});
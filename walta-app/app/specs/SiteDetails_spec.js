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

describe.only("SiteDetails controller", function() {
    var ctl;
    var sample= Alloy.Models.sample;

	beforeEach( function() {
        sample = Alloy.Models.instance("sample");
        sample.clear();
        sample.set("surveyType", 2);
		ctl = Alloy.createController("SiteDetails");
	});
	afterEach( function(done) {
		closeWindow( ctl.getView(), done );
    });
    
	it('should display the SiteDetails view', function(done) {
		controllerOpenTest( ctl, done );
    });

    it('should display "unobtained location" with no lock', function(done) {
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("Location unobtained");
            done();
        } );
    });

    it('should display location coordinates with a lock', function(done) {
        sample.clear();
        sample.set("surveyType", 2);
        sample.set("lng", "147.671339");
        sample.set("lat", "-42.890748");
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            done();
        } );
    });

    it('should open a map viewer when locatin icon is clicked', function(done) {
        sample.clear();
        sample.set("surveyType", 2);
        sample.set("lng", "147.671339");
        sample.set("lat", "-42.890748");
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            ctl.locationIndicator.fireEvent("click");
            setTimeout( function() {
                expect( ctl.locationEntry.getView().visible ).to.be.true;
                done();
            }, 50 );
        } );
    });
});
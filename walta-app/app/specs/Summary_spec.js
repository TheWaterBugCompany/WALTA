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
var { closeWindow, controllerOpenTest, checkTestResult } = require("specs/util/TestUtils");
var mocx = require("specs/lib/mocx");

describe("Summary controller", function() {
	var ctl;
	beforeEach( function() {
        
        mocx.createModel("sample");
        Alloy.Models.sample.saveCurrentSample = function() {};
        Alloy.Globals.CerdiApi = {};
        Alloy.Globals.CerdiApi.retrieveUserToken = function() {
            return "token"; 
        };
        
	});
	afterEach( function(done) {
		closeWindow( ctl.getView(), done );
	});
	it('should display the Summary view with lock not obtained message', function(done) {
        ctl = Alloy.createController("Summary");
		controllerOpenTest( ctl, function() {
            checkTestResult( done, function() {
                expect( ctl.message.text ).to.include("GPS lock yet");
                expect( ctl.doneButton.title ).to.equal("Done");
                expect( ctl.doneButton.touchEnabled ).to.be.false;
            });
        } );
    });
    
    it('should display the Summary view with not registered message', function(done) {
        Alloy.Globals.CerdiApi.retrieveUserToken = function() {};
        Alloy.Models.sample.set('lng', -122.84 );
        Alloy.Models.sample.set('lat', 37.42 );
        ctl = Alloy.createController("Summary");
		controllerOpenTest( ctl, function() {
            checkTestResult( done, function() {
                expect( ctl.message.text ).to.include("next step is to register");
                expect( ctl.latLabel.text ).to.equal(37.42);
                expect( ctl.longLabel.text ).to.be.equal(-122.84);
                expect( ctl.doneButton.title ).to.equal("Register");
                expect( ctl.doneButton.touchEnabled ).to.be.true;
            });
        } );
    });

    it('should display the coords if a lock has been obtained', function(done) {
        Alloy.Models.sample.set('lng', -122.84 );
        Alloy.Models.sample.set('lat', 37.42 );
        ctl = Alloy.createController("Summary");
		controllerOpenTest( ctl, function() {
            checkTestResult( done, function() {
                expect( ctl.message.text ).to.include("Congratulations");
                expect( ctl.latLabel.text ).to.equal(37.42);
                expect( ctl.longLabel.text ).to.be.equal(-122.84);
                expect( ctl.doneButton.title ).to.equal("Done");
            });
        } );
    });
});
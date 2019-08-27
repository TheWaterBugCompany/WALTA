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
var moment = require("lib/moment");

var { SURVEY_ORDER, SURVEY_DETAILED, WATERBODY_LAKE } = require("logic/Sample");
var { expect } = require("unit-test/lib/chai");
var { closeWindow, controllerOpenTest, checkTestResult } = require("unit-test/util/TestUtils");

describe("SiteDetails controller", function() {
    var ctl;
    var sample;

    function fireTabClick( ctl, index ) {
        var tab = ctl.getButtons()[index];
        ctl.segCtrlWrapper.fireEvent("click", { x: tab.rect.x + tab.rect.width/2, y: tab.rect.y} );
    }

	beforeEach( function() {
        sample = Alloy.Models.instance("sample");
        sample.clear();
        sample.set("lng", "147.671339");
        sample.set("lat", "-42.890748");
        sample.set("surveyType", SURVEY_DETAILED );
        
		ctl = Alloy.createController("SiteDetails");
	});
	afterEach( function(done) {
        sample.off();
        closeWindow( ctl.getView(), done );
    });
    
	it('should display the SiteDetails view', function(done) {
		controllerOpenTest( ctl, done );
    });

    it('should save the survey type field', function(done) {
		controllerOpenTest( ctl, function() {
            ctl.on("updated", () => checkTestResult( () => {
                expect( parseInt( sample.get("surveyType") ) ).to.equal(SURVEY_ORDER);
            }, done));
            fireTabClick( ctl.surveyLevelSelect, SURVEY_ORDER );
        } );
    });

    it('should save the water body type field', function(done) {
		controllerOpenTest( ctl, function() {
            ctl.on("updated", () => checkTestResult( () => {
                expect( parseInt( sample.get("surveyType") ) ).to.equal(WATERBODY_LAKE);
            }, done));
            fireTabClick( ctl.waterbodyTypeSelect, WATERBODY_LAKE );
        } );
    });

    // FIXME: Missing unit test PhotoSelect_spec !!
    // then should have integration test here...
    it('should save the photo field');

    it('should save waterbody name field', function(done) {
        controllerOpenTest( ctl, function() {
            ctl.waterbodyNameField
                .addEventListener("change", function changeHandler() {
                    ctl.waterbodyNameField
                        .removeEventListener("change", changeHandler);
                    expect( sample.get("waterbodyName") ).to.equal("Test Waterbody");
                    done();
            });
            ctl.waterbodyNameField.value = "Test Waterbody";
            ctl.waterbodyNameField.fireEvent("change");
        } );
    });

    it('should save near by feature field', function(done) {
        controllerOpenTest( ctl, function() {
            ctl.nearByFeatureField
                .addEventListener("change", function changeHandler() {
                    ctl.nearByFeatureField
                        .removeEventListener("change", changeHandler);
                    expect( sample.get("nearbyFeature") ).to.equal("Near by feature");
                    done();
            } );
            ctl.nearByFeatureField.value = "Near by feature";
            ctl.nearByFeatureField.fireEvent("change");
        } );
    });

    it('should disable the next button if mandatory fields are unset', function(done) {
        controllerOpenTest( ctl, function() {
            expect( ctl.nextButton.enabled ).to.be.false;
            ctl.on("updated", function changeHandler() {
                    ctl.off("updated", changeHandler);
                    setTimeout( function() {
                        expect( ctl.nextButton.enabled, "button should be enabled" ).to.be.true;
                        done();
                    },10);
            } );
            fireTabClick( ctl.surveyLevelSelect, SURVEY_ORDER );
            fireTabClick( ctl.waterbodyTypeSelect, WATERBODY_LAKE );
            ctl.waterbodyNameField.value = "Test Waterbody";
            ctl.waterbodyNameField.fireEvent("change");

        } );
    });

    it('should display "unobtained location" with no lock', function(done) {
        controllerOpenTest( ctl, function() {
            // unset these here to avoid triggering the geolocation service
            sample.unset("lng");
            sample.unset("lat");
            expect( ctl.locationStatus.text ).to.equal("Location unobtained");
            done();
        } );
    });

    it('should display location coordinates with a lock', function(done) {
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            done();
        } );
    });

    it('should update coordinates when location is changed', function(done) {
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            sample.set("lng", "145.671339");
            sample.set("lat", "-41.890748");
            setTimeout( function() {
                expect( ctl.locationStatus.text ).to.equal("41.8907°S 145.6713°E");
                done();
            }, 50 );
        } );
    });

    it('should open a map viewer when location icon is clicked', function(done) {
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            ctl.locationIndicator.fireEvent("click");
            setTimeout( function() {
                expect( ctl.locationEntry.getView().visible ).to.be.true;
                done();
            }, 50 );
        } );
    });

   /* it('should have editable fields before 14 days', function(done) {
        sample.set("dateCompleted", moment().subtract(13, "days").format() );
        controllerOpenTest( ctl, function() {
            expect( ctl.surveyLevelSelect.isDisabled() ).to.be.false;
            expect( ctl.waterbodyTypeSelect.isDisabled() ).to.be.false;
            expect( ctl.waterbodyNameField.editable ).to.be.undefined;
            expect( ctl.nearByFeatureField.editable ).to.be.undefined;
            done();
        } );
    });

    it('should have read only fields after 14 days', function(done) {
        sample.set("dateCompleted", moment().subtract(16, "days").format() );
        controllerOpenTest( ctl, function() {
            expect( ctl.surveyLevelSelect.isDisabled() ).to.be.true;
            expect( ctl.waterbodyTypeSelect.isDisabled() ).to.be.true;
            expect( ctl.waterbodyNameField.editable ).to.be.false;
            expect( ctl.nearByFeatureField.editable ).to.be.false;
            done();
        } );
    });

    it("photo shouldn't be selectable afer 14 days", function(done) {
        sample.set("dateCompleted", moment().subtract(16, "days").format() );
        controllerOpenTest( ctl, function() {
            expect( ctl.photoSelect.disabled ).to.be.true;
            done();
        } );
    });

    it("location shouldn't be selectable afer 14 days", function(done) {
        sample.set("dateCompleted", moment().subtract(16, "days").format() );
        controllerOpenTest( ctl, function() {
            expect( ctl.photoSelect.disabled ).to.be.true;
            done();
        } ); 
    }); */
});
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
var moment = require('lib/moment')
var Topics = require('ui/Topics'); 
var { SURVEY_ORDER, SURVEY_DETAILED, WATERBODY_LAKE } = require("logic/Sample");
var { expect } = require("unit-test/lib/chai");
var { closeWindow, controllerOpenTest, checkTestResult, setManualTests } = require("unit-test/util/TestUtils");
var { simulatePhotoCapture } = require("unit-test/mocks/MockCamera");
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
	});
	afterEach( function(done) {
        sample.off();
        closeWindow( ctl.getView(), done );
        sample = null;
        ctl = null;
    });
    
	it('should display the SiteDetails view', function(done) {
        ctl = Alloy.createController("SiteDetails");
		controllerOpenTest( ctl, done );
    });

    it('should save the survey type field', function(done) {   
        ctl = Alloy.createController("SiteDetails");
		controllerOpenTest( ctl, function() {
            ctl.on("updated", () => checkTestResult( () => {
                expect( parseInt( sample.get("surveyType") ) ).to.equal(SURVEY_ORDER);
            }, done));
            fireTabClick( ctl.surveyLevelSelect, SURVEY_ORDER );
        } );
    });

    it('should save the water body type field', function(done) {    
        ctl = Alloy.createController("SiteDetails");
		controllerOpenTest( ctl, function() {
            ctl.on("updated", () => checkTestResult( done, () => {
                expect( parseInt( sample.get("surveyType") ) ).to.equal(WATERBODY_LAKE);
            }));
            fireTabClick( ctl.waterbodyTypeSelect, WATERBODY_LAKE );
        } );
    });

    it('should save the photo field', function(done){   
        ctl = Alloy.createController("SiteDetails");
        var doneOnce = _.once(done);
        controllerOpenTest( ctl,  ()=>{
            // set a photo as if taken by the user
            ctl.photoSelect.on("loaded", () => checkTestResult( doneOnce, () => {
                expect( ctl.photoSelect.getThumbnailImageUrl() ).to.include("preview_thumbnail");
                expect( Ti.Filesystem.getFile( ctl.photoSelect.getThumbnailImageUrl() ).exists() ).to.be.ok;
            }) );
            simulatePhotoCapture( ctl.photoSelect );
        });
    }); 

    it('should save waterbody name field', function(done) { 
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            ctl.waterbodyNameField
                .addEventListener("change", () => checkTestResult( done, function changeHandler() {
                    ctl.waterbodyNameField
                        .removeEventListener("change", changeHandler);
                    expect( sample.get("waterbodyName") ).to.equal("Test Waterbody");
            }));
            ctl.waterbodyNameField.value = "Test Waterbody";
            ctl.waterbodyNameField.fireEvent("change");
        } );
    });

    it('should save near by feature field', function(done) {    
        ctl = Alloy.createController("SiteDetails");
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
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            expect( ctl.nextButton.button.enabled ).to.be.false;
            ctl.on("updated", function changeHandler() {
                    ctl.off("updated", changeHandler);
                    setTimeout( function() {
                        expect( ctl.nextButton.button.enabled, "button should be enabled" ).to.be.true;
                        done();
                    },10);
            } );
            fireTabClick( ctl.surveyLevelSelect, SURVEY_ORDER );
            fireTabClick( ctl.waterbodyTypeSelect, WATERBODY_LAKE );
            ctl.waterbodyNameField.value = "Test Waterbody";
            ctl.waterbodyNameField.fireEvent("change");

        } );
    });

    it('should fire Topics.Habitat if next button pressed', function(done) {      
        ctl = Alloy.createController("SiteDetails");
        Topics.subscribe( Topics.HABITAT, function handler() {
            Topics.unsubscribe( Topics.HABITAT, handler );
            // we recieved the signal so pass!
            done();
        });
        controllerOpenTest( ctl, function() {
            expect( ctl.nextButton.button.enabled ).to.be.false;
            ctl.on("updated", function handler() {
                    ctl.off("updated", handler);
                    // screen refresh neeeds to happen so put the click action on 
                    // the queue to run afterwards.
                    setTimeout( () => ctl.nextButton.NavButton.fireEvent("click"), 0 );
            } );
            fireTabClick( ctl.surveyLevelSelect, SURVEY_ORDER );
            fireTabClick( ctl.waterbodyTypeSelect, WATERBODY_LAKE );
            ctl.waterbodyNameField.value = "Test Waterbody";
            ctl.waterbodyNameField.fireEvent("change");
        } );
    });

    it('should display "unobtained location" with no lock', function(done) {       
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            // unset these here to avoid triggering the geolocation service
            sample.unset("lng");
            sample.unset("lat");
            expect( ctl.locationStatus.text ).to.equal("Location unobtained");
            done();
        } );
    });

    it('should display location coordinates with a lock', function(done) {     
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            done();
        } );
    });

    it('should update coordinates when gps lock is obtained', function(done) {   
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            sample.unset("lng");
            sample.unset("lat");
            Topics.fireTopicEvent(Topics.GPSLOCK, { latitude: -41.8907, longitude: 145.6713, accuracy: 1 });
            setTimeout( () => checkTestResult( done, () => {
                expect( ctl.locationStatus.text ).to.equal("41.8907°S 145.6713°E");
            }), 50 );
        } );
    });
    
    it('should update coordinates when location is changed', function(done) {        
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            sample.set("lng", "145.671339");
            sample.set("lat", "-41.890748");
            setTimeout( () => checkTestResult( done, () => {
                expect( ctl.locationStatus.text ).to.equal("41.8907°S 145.6713°E");
            }), 50 );
        } );
    });

    it('should NOT update coordinates when a new gps lock is obtained if location already set', function(done) {     
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            Topics.fireTopicEvent(Topics.GPSLOCK, { latitude: 23, longitude: 100, accuracy: 1 });
            setTimeout( () => checkTestResult( done, () =>  {
                expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            }), 50 );
        } );
    });


    it('should open a map viewer when location icon is clicked', function(done) {   
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            ctl.locationIndicator.fireEvent("click");
            setTimeout( function() {
                expect( ctl.locationEntry.getView().visible ).to.be.true;
                done();
            }, 50 );
        } );
    }); 
    
    it('should have editable fields', function(done) {   
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            expect( ctl.surveyLevelSelect.isDisabled() ).to.be.false;
            expect( ctl.waterbodyTypeSelect.isDisabled() ).to.be.false;
            expect( ctl.waterbodyNameField.editable ).to.be.undefined;
            expect( ctl.nearByFeatureField.editable ).to.be.undefined;
            done();
        } );
    });

    it('should NOT have editable fields in read only mode', function(done) {     
        ctl = Alloy.createController("SiteDetails", { readonly: true });
        controllerOpenTest( ctl, function() {
            expect( ctl.surveyLevelSelect.isDisabled() ).to.be.true;
            expect( ctl.waterbodyTypeSelect.isDisabled() ).to.be.true;
            expect( ctl.waterbodyNameField.editable ).to.be.false;
            expect( ctl.nearByFeatureField.editable ).to.be.false;
            done();
        } );
    });

    it("photo should be selectable", function(done) {
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            expect( ctl.photoSelect.camera.visible).to.be.true;
            done();
        } );
    });

    it("photo should NOT be selectable when in read only mode", function(done) {
        ctl = Alloy.createController("SiteDetails", { readonly: true });
        controllerOpenTest( ctl, function() {
            expect( ctl.photoSelect.camera.visible).to.be.false;
            done();
        } );
    });

    it("location should be selectable", function(done) {
        ctl = Alloy.createController("SiteDetails");
        controllerOpenTest( ctl, function() {
            ctl.locationIndicator.fireEvent("click");
            setTimeout( function() {
                expect( ctl.locationEntry.getView().visible ).to.be.true;
                expect( ctl.locationEntry.args.readonly).to.be.false;
                done();
            }, 50 );
        } ); 
    }); 

    it("location should NOT be selectable when in read only mode", function(done) {
        ctl = Alloy.createController("SiteDetails", { readonly: true });
        controllerOpenTest( ctl, function() {
            ctl.locationIndicator.fireEvent("click");
            setTimeout( function() {
                expect( ctl.locationEntry.getView().visible ).to.be.true;
                expect( ctl.locationEntry.args.readonly).to.be.true;
                done();
            }, 50 );
        } ); 
    }); 
});
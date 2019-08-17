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
var { closeWindow, controllerOpenTest, checkTestResult } = require("unit-test/util/TestUtils");
var mocx = require("unit-test/lib/mocx");

describe("Summary controller", function() {
    var ctl;
    
    function doTest( done, assertitions ) {
        ctl = Alloy.createController("Summary");
        controllerOpenTest( ctl, function() {
            checkTestResult( done, function() {
                assertitions(); 
            });
        } );
    }

	beforeEach( function() {
        Alloy.Models.sample = null;
        Alloy.Models.sample = Alloy.Models.instance("sample");
        Alloy.Models.sample.set("waterbodyName","Test Waterbody");
        Alloy.Models.sample.set("nearbyFeature", "near the office intersection cupboard");
        Alloy.Models.sample.set( "dateCompleted", Date.now() );
        Alloy.Models.sample.set( "surveyType", 0 );

        Alloy.Models.sample.calculateSignalScore = function() { return "3.0"; };
        Alloy.Models.sample.calculateWeightedSignalScore = function() { return "3.5"; };
        Alloy.Models.sample.saveCurrentSample = function() {};
        Alloy.Models.sample.loadTaxa = function() { return []; };
        Alloy.Globals.CerdiApi = {};
        Alloy.Globals.CerdiApi.retrieveUserToken = function() {return "token"; }; 
    });
    
	afterEach( function(done) {
		closeWindow( ctl.getView(), done );
    });
    it('should display the SIGNAL scores on the Summary view', function(done) {
        doTest( done, function() {
            expect( ctl.signalScore.text ).to.equal("3.0");
            expect( ctl.weightedSignalScore.text ).to.equal("3.5");
        });
    });

	it('should display the Summary view with lock not obtained message', function(done) {
        doTest( done, function() {
            expect( ctl.message.text ).to.include("GPS lock yet");
            expect( ctl.doneButton.title ).to.equal("Done");
            expect( ctl.doneButton.touchEnabled ).to.be.false;
        });
    });
    
    it('should display the Summary view with not registered message', function(done) {
        Alloy.Globals.CerdiApi.retrieveUserToken = function() {};
        Alloy.Models.sample.set('lng', -122.841234234234 );
        Alloy.Models.sample.set('lat', 37.4223423342 );
        doTest( done, function() {
            expect( ctl.message.text ).to.include("next step is to register");
            //expect( ctl.latLabel.text ).to.equal('37.42234');
            //expect( ctl.longLabel.text ).to.be.equal('-122.84123');
            expect( ctl.doneButton.title ).to.equal("Submit");
            expect( ctl.doneButton.touchEnabled ).to.be.true;
        });
    });

    it('should display the coords if a lock has been obtained', function(done) {
        Alloy.Models.sample.set('lng', -122.841234234234 );
        Alloy.Models.sample.set('lat', 37.4223423342 );
        doTest( done, function() {
            expect( ctl.message.text ).to.include("survey is complete");
            //expect( ctl.latLabel.text ).to.equal('37.42234');
            //expect( ctl.longLabel.text ).to.equal('-122.84123');
            expect( ctl.doneButton.title ).to.equal("Submit");
        });
    });
    [
        [ 0.0, 4.0, "is heavily impacted", "", "", "It has lots of different waterbugs" ],
        [ 4.0, 5.0, "is impacted", "", "", "It has lots of different waterbugs" ],
        [ 5.0, 6.0, "is probably mildly polluted", "", "It might have suffered from a recent flood or some other abrupt impact", "It has lots of different waterbugs" ],
        [ 6.0, 10.0, "is probably healthy", "It is scoring less with the weighted SIGNAL because there are many more tolerant animals than sensitive ones ....perhaps there is some nutrient enrichment at the site?",
         "It might have suffered from a recent flood or some other abrupt impact", "It has a great diversity of waterbugs" ]
    ].forEach( ([ min, max, text, extraDiff2, extraTaxa5, extraTaxa15]) => {
        describe(`${min}-${max} scores summary report`, function() {

            it("should have the correct main text", function(done) {
                Alloy.Models.sample.calculateSignalScore = function() { return (min+max)/2; };
                Alloy.Models.sample.calculateWeightedSignalScore = function() { return (min+max)/2; };
                Alloy.Models.sample.loadTaxa = function() {
                    return mocx.createCollection("taxa", [
                        { taxonId: "1", abundance: "3-5" },
                        { taxonId: "2", abundance: "1-2" },
                        { taxonId: "3", abundance: "3-5" },
                        { taxonId: "4", abundance: "1-2" },
                        { taxonId: "5", abundance: "3-5" },
                        { taxonId: "6", abundance: "1-2" }
                    ]);
                }
                doTest( done, function() {
                    expect( ctl.interpretation.text ).to.include(text);
                    if ( extraDiff2.length > 0 )
                        expect( ctl.interpretation.text ).to.not.include(extraDiff2);
                    if ( extraTaxa5.length > 0  )
                        expect( ctl.interpretation.text ).to.not.include(extraTaxa5);
                    if ( extraTaxa15.length > 0  )
                        expect( ctl.interpretation.text ).to.not.include(extraTaxa15);
                } );
            });

            it("should correctly include extra text when the score difference is greater than 2", function(done) {
                Alloy.Models.sample.calculateSignalScore = function() { return (min+max)/2; };
                Alloy.Models.sample.calculateWeightedSignalScore = function() { return (min+max)/2 - 3; };
                Alloy.Models.sample.loadTaxa = function() {
                    return mocx.createCollection("taxa", [
                        { taxonId: "1", abundance: "3-5" },
                        { taxonId: "2", abundance: "1-2" },
                        { taxonId: "3", abundance: "3-5" },
                        { taxonId: "4", abundance: "1-2" },
                        { taxonId: "5", abundance: "3-5" },
                        { taxonId: "6", abundance: "1-2" }
                    ]);
                };
                doTest( done, function() {
                    expect( ctl.interpretation.text ).to.include(text);
                    if ( extraDiff2.length > 0 )
                        expect( ctl.interpretation.text ).to.include(extraDiff2);
                    if ( extraTaxa5.length > 0  )
                        expect( ctl.interpretation.text ).to.not.include(extraTaxa5);
                    if ( extraTaxa15.length > 0  )
                        expect( ctl.interpretation.text ).to.not.include(extraTaxa15);
                } );
            });

            it("should correctly include extra text when the taxa count is greater than 5 but less than 15", function(done) {
                Alloy.Models.sample.calculateSignalScore = function() { return (min+max)/2; };
                Alloy.Models.sample.calculateWeightedSignalScore = function() { return (min+max)/2; };
                Alloy.Models.sample.loadTaxa = function() {
                    return mocx.createCollection("taxa", [
                        { taxonId: "1", abundance: "3-5" },
                        { taxonId: "2", abundance: "1-2" },
                        { taxonId: "3", abundance: "3-5" },
                        { taxonId: "4", abundance: "1-2" },
                        { taxonId: "5", abundance: "3-5" },
                        { taxonId: "6", abundance: "1-2" }
                    ]);
                }
                doTest( done, function() {
                    expect( ctl.interpretation.text ).to.include(text);
                    if ( extraDiff2.length > 0 )
                        expect( ctl.interpretation.text ).to.not.include(extraDiff2);
                    if ( extraTaxa5.length > 0 )
                        expect( ctl.interpretation.text ).to.not.include(extraTaxa5);
                    if ( extraTaxa15.length > 0 )
                        expect( ctl.interpretation.text ).to.not.include(extraTaxa15);
                } );
            });

            it("should correctly include extra text when the taxa count is less than 5", function(done) {
                Alloy.Models.sample.calculateSignalScore = function() { return (min+max)/2; };
                Alloy.Models.sample.calculateWeightedSignalScore = function() { return (min+max)/2; };
                Alloy.Models.sample.loadTaxa = function() {
                    return mocx.createCollection("taxa", [
                        { taxonId: "1", abundance: "3-5" },
                        { taxonId: "3", abundance: "1-2" }
                    ]);
                }
                doTest( done, function() {
                    expect( ctl.interpretation.text ).to.include(text);
                    if ( extraDiff2.length > 0 )
                        expect( ctl.interpretation.text ).to.not.include(extraDiff2);
                    if ( extraTaxa5.length > 0 )
                        expect( ctl.interpretation.text ).to.include(extraTaxa5);
                    if ( extraTaxa15.length > 0 )
                        expect( ctl.interpretation.text ).to.not.include(extraTaxa15);
                } );
            });

            it("should correctly include extra text when the taxa count is greater than 15", function(done) {
                Alloy.Models.sample.calculateSignalScore = function() { return (min+max)/2; };
                Alloy.Models.sample.calculateWeightedSignalScore = function() { return (min+max)/2; };
                Alloy.Models.sample.loadTaxa = function() {
                    return mocx.createCollection("taxa", [
                        { taxonId: "1", abundance: "3-5" },
                        { taxonId: "2", abundance: "1-2" },
                        { taxonId: "3", abundance: "3-5" },
                        { taxonId: "4", abundance: "1-2" },
                        { taxonId: "5", abundance: "3-5" },
                        { taxonId: "6", abundance: "1-2" },
                        { taxonId: "7", abundance: "3-5" },
                        { taxonId: "8", abundance: "1-2" },
                        { taxonId: "9", abundance: "3-5" },
                        { taxonId: "10", abundance: "1-2" },
                        { taxonId: "11", abundance: "3-5" },
                        { taxonId: "12", abundance: "1-2" },
                        { taxonId: "13", abundance: "3-5" },
                        { taxonId: "14", abundance: "1-2" },
                        { taxonId: "15", abundance: "3-5" },
                        { taxonId: "16", abundance: "1-2" }
                    ]);
                }
                doTest( done, function() {
                    expect( ctl.interpretation.text ).to.include(text);
                    if ( extraDiff2.length > 0 )
                        expect( ctl.interpretation.text ).to.not.include(extraDiff2);
                    if ( extraTaxa5.length > 0 )
                        expect( ctl.interpretation.text ).to.not.include(extraTaxa5);
                    if ( extraTaxa15.length > 0 )
                        expect( ctl.interpretation.text ).to.include(extraTaxa15);
                } );
            });

        });
    });
});
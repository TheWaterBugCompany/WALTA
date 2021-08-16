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
var { closeWindow, setManualTests, wrapViewInWindow, windowOpenTest, checkTestResult, waitForTick } = require("unit-test/util/TestUtils");

var { speedBugIndexMock } = require('unit-test/mocks/MockSpeedbug');
var { createMockTaxon } = require('unit-test/mocks/MockTaxon');
var { keyMock } = require('unit-test/mocks/MockKey');
keyMock.addSpeedbugIndex( speedBugIndexMock );

describe("EditTaxon controller", function() {
    var ctl,win;
    function makeEditTaxon( taxon, readonly ) {
        let txn = createMockTaxon( taxon );
        ctl = Alloy.createController("EditTaxon", { 
            key: keyMock,
            taxon: txn,
            readonly: readonly
         });
         
        win = wrapViewInWindow( ctl.getView() );
        win.addEventListener( "close", function cleanUp() {
            win.removeEventListener("close", cleanUp);
            ctl.cleanUp();
         });
         return txn;
    }

    afterEach( function(done ) {
        closeWindow( win, done ); 
    });

	it('should display the taxon edit view', function(done) {  
        makeEditTaxon( { taxonId:"1", abundance:"3-5" } );
        windowOpenTest( win, function() {
            checkTestResult( done,
                function() {
                    expect( ctl.taxonName.text ).to.equal( "Aeshnidae Telephleb" );
                    expect( ctl.abundanceLabel.text ).to.equal("3-5");
                } ); 
        } );
    });

    it('save should be disabled if the photo is blank', function(done) {
        makeEditTaxon( { taxonId:"1", abundance:"3-5" } );
            
        windowOpenTest( win, function() {
            checkTestResult( done, function() {
                expect( ctl.saveButton.enabled ).to.be.false;
                expect( ctl.photoSelect.photoSelectLabel.visible ).to.be.true;
                expect( ctl.photoSelect.photoSelectBoundary.borderColor ).to.equal("red");
            } );
        });
    });
 
    it('save should be enabled if a photo is selected', function(done) {
        makeEditTaxon( { taxonId:"1", abundance:"3-5" } );

        function checkSaveEnabled() {
            ctl.photoSelect.off("loaded", checkSaveEnabled );
            checkTestResult( done, () => {
                expect( ctl.saveButton.enabled ).to.be.true;
                expect( ctl.photoSelect.photoSelectLabel.visible ).to.be.false;
                expect( ctl.photoSelect.photoSelectBoundary.borderColor ).to.equal("transparent");
            } )
        }

        windowOpenTest( win, () => {
            ctl.photoSelect.on("loaded", function handler() {
                ctl.photoSelect.off("loaded", handler );
                ctl.photoSelect.on("loaded", checkSaveEnabled );
                ctl.setImage("/unit-test/resources/simpleKey1/media/amphipoda_01.jpg")
            }) ;
        }); 
    });

    it('save should be enabled if a taxon already has a photo set', function(done) {
        makeEditTaxon( { taxonId:"1", abundance:"3-5", taxonPhotoPath: "/unit-test/resources/simpleKey1/media/amphipoda_01.jpg" } )
        function checkSaveEnabled() {
            ctl.photoSelect.off("loaded", checkSaveEnabled );
            checkTestResult( done, () => {
                expect( ctl.saveButton.enabled, "save button enabled" ).to.be.true;
                expect( ctl.photoSelect.photoSelectLabel.visible, "please take photo should be invisible" ).to.be.false;
                expect( ctl.photoSelect.photoSelectBoundary.borderColor, "should not have a red border" ).to.equal("transparent");
            } )
        }
        ctl.photoSelect.on("loaded", checkSaveEnabled );
        windowOpenTest( win );
    });

    it('should call the save event when save is selected', function(done) {  
        makeEditTaxon( { taxonId:"1", abundance:"3-5" } );
        windowOpenTest( win, () => {
            ctl.photoSelect.on("loaded",function handler() {
                ctl.photoSelect.off("loaded",handler);
                ctl.on("save", function handler(txn) { 
                    ctl.off("save", handler);
                    checkTestResult(done, () => {
                        // wait for database to persist changes
                        waitForTick(1)().then( () => expect( txn.getPhoto() ).to.include("preview") );
                    } );
                });
                ctl.saveButton.fireEvent("click");
            });
            ctl.setImage("/unit-test/resources/simpleKey1/media/speedbug/amphipoda_b.png")
        } );
    });

    it('should have slider disabled in readonly mode', function(done){
        makeEditTaxon( { taxonId:"1", abundance:"3-5" }, true );
        windowOpenTest( win, () => { 
            checkTestResult(done, () => {
                expect( ctl.abundanceValue.enabled ).to.be.false;
            } )
        });
    });

    it('should have PhotoSelect disabled in readonly mode', function(done){
        makeEditTaxon( { taxonId:"1", abundance:"3-5" }, true );
        windowOpenTest( win, () => { 
            checkTestResult(done, () => {
                expect( ctl.photoSelect.camera.visible).to.be.false;
            } )
        });
    });

    it('should have save button disabled in readonly mode', function(done){
        makeEditTaxon( { taxonId:"1", abundance:"3-5" }, true );
        windowOpenTest( win, () => { 
            checkTestResult(done, () => {
                expect( ctl.saveButton.enabled).to.be.false;
            } )
        });
    });

    it('should have delete button disabled in readonly mode', function(done){
        makeEditTaxon( { taxonId:"1", abundance:"3-5" }, true );
        windowOpenTest( win, () => { 
            checkTestResult(done, () => {
                expect( ctl.deleteButton.enabled).to.be.false;
            } )
        });
    });
    
    [ ["1-2", 2],  ["3-5", 4.0], ["6-10", 8.0], ["11-20", 16] ]
        .forEach( ( [ bin, val ] ) => {
            it(`should display abundance correctly: ${bin} (${val})`, function(done) {
                makeEditTaxon( { taxonId:"1", abundance:bin} );
                windowOpenTest( win, function() {
                    checkTestResult( done, 
                        function() {
                            expect( ctl.abundanceValue.value ).to.equal(val);
                            expect( ctl.abundanceLabel.text ).to.equal(bin);
                        } );
                    });
            });
        });

    it("should display an unknown bug");
});
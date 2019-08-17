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
var { closeWindow, forceCloseWindow, wrapViewInWindow, windowOpenTest, checkTestResult } = require("unit-test/util/TestUtils");

var { speedBugIndexMock } = require('unit-test/mocks/MockSpeedbug');
var { keyMock } = require('unit-test/mocks/MockKey');
keyMock.addSpeedbugIndex( speedBugIndexMock );


// FIXME: Alloy.Globals.Key is a global so that it can be accessed in the model itself
// is there a way of passing services to Alloy models without using globals?
Alloy.Globals.Key = keyMock; 

describe.only("EditTaxon controller", function() { 
    var ctl,win;
    
    function makeEditTaxon( taxon ) {
        ctl = Alloy.createController("EditTaxon", { 
            key: keyMock,
            taxon: Alloy.createModel( "taxa", taxon )
         });
        win = wrapViewInWindow( ctl.getView() );
    }

    afterEach( function(done ) {
        if ( win )
            closeWindow( win, done );
        else
            done();
    });

	it('should display the taxon edit view', function(done) { 
        makeEditTaxon( { taxonId:"1", abundance:"3-5" } );
        windowOpenTest( win, function() {
            checkTestResult( (e) => done(e), 
                function() {
                    expect( ctl.taxonName.text ).to.equal( "Aeshnidae Telephleb" );
                    expect( ctl.photoSelect.photo.image ).to.include("aeshnidae_telephleb_b.png");
                    expect( ctl.abundanceLabel.text ).to.equal("3-5");
                }); 
            
        } );
        
    });

    it('save should be disabled if the photo is blank', function(done) {
        makeEditTaxon( { taxonId:"1", abundance:"3-5" } );
        windowOpenTest( win, function() {
            checkTestResult( (e) => done(e), function() {
                expect( ctl.saveButton.enabled ).to.be.false;
                expect( ctl.photoSelect.photoSelectLabel.visible ).to.be.true;
                expect( ctl.photoSelect.photoSelectBoundary.borderColor ).to.equal("red");
            });
        });
    });
 
    it('save should be enabled if a photo is selected', function(done) {
        makeEditTaxon( { taxonId:"1", abundance:"3-5" } );
        windowOpenTest( win, function() {
            var photo = Ti.Filesystem.getFile( Ti.Filesystem.resourcesDirectory, "unit-test/resources/simpleKey1/media/amphipoda_02.jpg");
            ctl.photoSelect.trigger("photoTaken", photo);
            expect( ctl.saveButton.enabled ).to.be.true;
            expect( ctl.photoSelect.photoSelectLabel.visible ).to.be.false;
            expect( ctl.photoSelect.photoSelectBoundary.borderColor ).to.be.null;
            done();
        });
    });

    it('should display abundance correctly', function() {
        var abudances = [ 
            ["1-2", 1.5],  
            ["3-5", 4.0], 
            ["6-10", 8.0], 
            ["11-20", 15.5] 
        ];

        function checkAbundance( bin, val ) {
            return new Promise( (resolve) => {
                makeEditTaxon( { taxonId:"1", abundance:bin} );
                windowOpenTest( win, function() {
                    checkTestResult( () => forceCloseWindow( win, ()=> { win = null; resolve(); } ), 
                        function() {
                            expect( ctl.abundanceValue.value ).to.equal(val);
                            expect( ctl.abundanceLabel.text ).to.equal(bin);
                        } );
                    });
            });
        }

        return abudances
          .reduce( ( promise, [ bin, val ] ) =>
                promise.then( () => checkAbundance( bin, val ) ), 
            Promise.resolve() );
    });
});
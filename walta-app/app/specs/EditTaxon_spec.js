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
var { closeWindow, forceCloseWindow, wrapViewInWindow, windowOpenTest, checkTestResult } = require("specs/util/TestUtils");
var { createModel } = require("specs/lib/mocx");

var { speedBugIndexMock } = require('specs/mocks/MockSpeedbug');
var { keyMock } = require('specs/mocks/MockKey');
keyMock.addSpeedbugIndex( speedBugIndexMock );


// FIXME: Alloy.Globals.Key is a global so that it can be accessed in the model itself
// is there a way of passing services to Alloy models without using globals?
Alloy.Globals.Key = keyMock; 
//Ti.API.info(`${JSON.stringify(Alloy.Globals.Key.speedbugIndex["test"].name)}`);

describe.only("EditTaxon controller", function() { 
    var ctl,win;
    
    function makeEditTaxon( taxon ) {
        ctl = Alloy.createController("EditTaxon", { 
            key: keyMock,
            taxon: Alloy.createModel( "taxa", taxon )
         });
        win = wrapViewInWindow( ctl.getView() );
    }
    
	it('should display the taxon edit view', function(done) {
        makeEditTaxon( { taxonId:"1", abundance:"3-5" } );
        windowOpenTest( win, function() {
            checkTestResult( (e) => closeWindow( win, () => done( e ) ), 
                function() {
                    expect( ctl.taxonName.text ).to.equal( "Aeshnidae Telephleb" );
                    expect( ctl.photoSelect.photo.image ).to.include("aeshnidae_telephleb_b.png");
                    expect( ctl.abundanceLabel.text ).to.equal("3-5");
                }); 
            
        } );
        
    });

    it.only('save should be disabled if the photo is blank', function(done) {
        makeEditTaxon( { taxonId:"1", abundance:"3-5" } );
        windowOpenTest( win, function() {
            expect( ctl.saveButton.enabled ).to.be.false;
            expect( ctl.photoSelect.photoSelect.borderColor ).to.equal("red");
            done();
        });
    });

    it.only('save should be eabled if a photo is selected', function(done) {
        makeEditTaxon( { taxonId:"1", abundance:"3-5" } );
        windowOpenTest( win, function() {
            var photo = Ti.Filesystem.getFile( Ti.Filesystem.resourcesDirectory, "specs/resources/simpleKey1/media/amphipoda_02.jpg");
            ctl.photoSelect.trigger("photoTaken", photo);
            expect( ctl.saveButton.enabled ).to.be.true;
            expect( ctl.photoSelect.photoSelect.borderColor ).to.equal("#26849c");
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
                    checkTestResult( () => forceCloseWindow( win, resolve ), 
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
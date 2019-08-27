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
var { closeWindow, windowOpenTest, wrapViewInWindow, clickButton, checkTestResult } = require("unit-test/util/TestUtils");
describe("LocationEntry controller", function() {
	var win, scr, view;
  var sample= Alloy.Models.sample;
  beforeEach( function() {
    sample = Alloy.Models.instance("sample");
    sample.off();
    sample.clear();
    scr = Alloy.createController("LocationEntry", { 
      getCurrentPosition: function( callback ) {
        callback( { 
          coords: {
            accuracy: 100,
            latitude: -42.890734,
            longitude: 147.671216
          }
        });
      }
    });
    view = scr.getView();
    win = wrapViewInWindow( view );
  });

  afterEach( function(done) {
    closeWindow( win, done );
  });

  it('should display overlay', function(done) {
    windowOpenTest( win, done );
	});

  it('should fire cancel event', function(done) {
    windowOpenTest( win, function () { 
      expect( view.visible ).to.be.true;
      scr.on("close", function event() {
        checkTestResult( ()=> {
          scr.off("close",event);
          expect( view.visible ).to.be.false;
          done();
        });
      });
      scr.cancelButton.fireEvent("click");
    });
  });

  it('should display existing location', function(done) {
    sample.set("lat","-42.888381");
    sample.set("lng","147.665715");
    windowOpenTest( win, done );
  });

  it('should set the location when the locate button is pressed', function(done) { 
    var removeDupsDone = _.once( done ); 
    scr.enable();
    windowOpenTest( win, function(){
      sample.on("change:lng change:lat", function() {
        checkTestResult( ()=> {
          let lat = parseFloat(sample.get("lat")),
              lng = parseFloat(sample.get("lng")),
              accuracy = parseFloat(sample.get("accuracy"));
          expect( lat ).to.equal(-42.890734);
          expect( lng ).to.equal(147.671216);
          expect( accuracy ).to.equal(100);
          removeDupsDone();
        });
        
      } );
      clickButton( scr.locateButton );
      clickButton( scr.saveButton );
    } );
  });
  
  it('should set the location on a map save', function(done) {
    var removeDupsDone = _.once( done ); 
    scr.enable();
    windowOpenTest( win, function(){
      sample.on("change:lng change:lat", function() {
        checkTestResult( ()=> {
          let lat = parseFloat(sample.get("lat")),
              lng = parseFloat(sample.get("lng"));
          expect( lat ).to.equal(-42.888);
          expect( lng ).to.equal(147.665);
          removeDupsDone();
        });
      } );
      scr.mapview.fireEvent("longclick", { latitude: -42.888, longitude: 147.665});
      clickButton( scr.saveButton );
    } );
  });

  it('should NOT set the location on a map cancel', function(done) {
    var removeDupsDone = _.once( done ); 
    scr.enable();
    windowOpenTest( win, function(){
      sample.on("change:lng change:lat", function() {
        expect.fail("map click changed point when map cancelled!");
      } );
      scr.mapview.fireEvent("mapclick", { latitude: -42.888, longitude: 147.665});
      clickButton( scr.cancelButton );
      setTimeout( done, 100 ); // 100 ms is enough to catch event if is going to happen
    } );
  });
  
  it('should NOT set the location on a click if disabled', function(done) {
    scr.disable();
    windowOpenTest( win, function(){
      sample.on("change:lng change:lat", function() {
        expect.fail("map click changed point when control disabled!");
      } ); 
      scr.mapview.fireEvent("mapclick", { latitude: -42.888, longitude: 147.665});
      setTimeout( done, 100 ); // 100 ms is enough to catch event if is going to happen
    } );
  });

});
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
var { closeWindow, windowOpenTest, wrapViewInWindow, waitForDomEvent } = require("specs/util/TestUtils");
describe("LocationEntry controller", function() {
	var win, scr, view;
  var sample= Alloy.Models.sample;
  beforeEach( function() {
    sample = Alloy.Models.instance("sample");
    sample.clear();
    scr = Alloy.createController("LocationEntry");
    view = scr.getView();
    win = wrapViewInWindow( view );
  });

  afterEach( function(done) {
    closeWindow( win, done );
  });

  it('should display overlay', function(done) {
    windowOpenTest( win, done );
	});

  it('should fire close event', function(done) {
    windowOpenTest( win, function () { 
      expect( view.visible ).to.be.true;
      scr.on("close", function event() {
        scr.off("close",event);
        expect( view.visible ).to.be.false;
        done();
      });
      scr.closeButton.fireEvent("click");
    });
  });

  it('should display existing location', function(done) {
    sample.set("lat","-42.888381");
    sample.set("lng","147.665715");
    windowOpenTest( win, done );
  });
  
  it('should set the location on a click', function(done) {
    // not sure why done() gets call twice and 
    // there isn't anything I can do about it
    var removeDupsDone = _.once( done ); 
    windowOpenTest( win, function(){
      sample.on("change:lng change:lat", function() {
        let lat = parseFloat(sample.get("lat")),
            lng = parseFloat(sample.get("lng"));
        expect( lat ).to.equal(-42.888);
        expect( lng ).to.equal(147.665);
        removeDupsDone();
      } );
      scr.mapview.fireEvent("mapclick", { latitude: -42.888, longitude: 147.665});
    } );
	});
});
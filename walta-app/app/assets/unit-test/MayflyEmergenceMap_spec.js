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
var { closeWindow, windowOpenTest, wrapViewInWindow, clickButton, checkTestResult} = require("unit-test/util/TestUtils");
describe("MayflyEmergenceMap controller", function() {
	var scr,view,win;
    function createMap() {
        scr = Alloy.createController("MayflyEmergenceMap", { 
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
        win.addEventListener( "close", function handler() { 
          win.removeEventListener("close", handler);
          scr.cleanUp();
        }) 
      }
	before( function() {
	});
	after( function(done) {
		closeWindow( win, done );
	});
	it('should display the MayflyEmergenceMap view', function(done) {
		createMap();
        windowOpenTest( win, done );
    });
    it('should send event for legend click'); // How to implement selecting a webview element
});
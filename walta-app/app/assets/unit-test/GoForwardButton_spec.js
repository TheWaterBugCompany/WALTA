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
var Topics = require("ui/Topics");
var { closeWindow, windowOpenTest, setManualTests, wrapViewInWindow, actionFiresTopicTest } = require("unit-test/util/TestUtils");
describe("GoForwardButton controller", function() {
  var acb, win, btn;
  this.timeout(6000);
	before( function(done) {
		acb = Alloy.createController( "AnchorBar", { title: "Anchor Bar"} );
    win = wrapViewInWindow( acb.getView() );
    btn = Alloy.createController("GoForwardButton", { topic: Topics.HABITAT});
    acb.addTool( btn.getView() ); 
    win.height = "10%";
    windowOpenTest( win, done );
	});

 	after( function(done) {
		closeWindow( win, done );
  });
  
	it('should display the correct label', function() {
    expect( acb.rightTools.children[0].children[0].children[0].text ).to.equal("NEXT");
  });

  it('should fire the correct event when the button is clicked', function(done) {
    actionFiresTopicTest( acb.rightTools.children[0], 'click', Topics.HABITAT, () => done() );
  });

});
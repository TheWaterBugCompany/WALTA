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
var { closeWindow, windowOpenTest, wrapViewInWindow, setManualTests } = require("unit-test/util/TestUtils");
describe.only("NavButton controller", function() {
  var acb, win;
  setManualTests(true);
  this.timeout(0);
	before( function(done) {
    acb = Alloy.createController( "AnchorBar", { title: "Anchor Bar"} );
    vw = acb.getView();
    vw.bottom = 0;
    vw.height = "10%";
    win = wrapViewInWindow( vw );


    var btn = Alloy.createController("NavButton");
    btn.setLabel( "Left" );
    btn.setTopic( Topics.HABITAT );
    btn.setIconLeft( "/images/icon-go-back.png" );
    acb.addTool( btn.getView() ); 

    btn = Alloy.createController("NavButton");
    btn.setLabel( "Right" );
    btn.setTopic( Topics.BACK );
    btn.setIconRight( "/images/icon-go-forward.png" );
    acb.addTool( btn.getView() ); 

    windowOpenTest( win, done );
	});

 	after( function(done) {
		closeWindow( win, done );
  });
  
	it('should display the correct left label', function() {
    expect( acb.rightTools.children[0].children[0].children[1].text ).to.equal("LEFT");
  });

  it('should display the correct right label', function() {
    expect( acb.rightTools.children[1].children[0].children[0].text ).to.equal("RIGHT");
  });


});
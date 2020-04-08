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
var mocx = require("unit-test/lib/mocx");
var { closeWindow, controllerOpenTest, resetDatabase, clickButton, setManualTests, enterText, checkTestResult } = require("unit-test/util/TestUtils");
describe("Habitat controller", function() {
    var ctl;
	beforeEach( function() {
    resetDatabase();
    mocx.createModel("sample");
		ctl = Alloy.createController("Habitat");
	});
	afterEach( function(done) {
		closeWindow( ctl.getView(), done );
	});
	it('should display the Habitat view', function(done) { 
    controllerOpenTest( ctl, done );
    
  });
  it('should persist habitat values', function(done) { 
    controllerOpenTest( ctl, () => checkTestResult( done, function() {
      expect( Alloy.Models.sample.get("boulder") ).to.be.undefined;
      expect( Alloy.Models.sample.get("gravel") ).to.be.undefined;
      expect( Alloy.Models.sample.get("sandOrSilt") ).to.be.undefined;
      expect( Alloy.Models.sample.get("wood") ).to.be.undefined;
      expect( Alloy.Models.sample.get("aquaticPlants") ).to.be.undefined;
      expect( Alloy.Models.sample.get("openWater") ).to.be.undefined;
      expect( Alloy.Models.sample.get("edgePlants") ).to.be.undefined;
      enterText( ctl.leaves, "17" );
      enterText( ctl.plants, "12" );
      enterText( ctl.wood, "8" );
      enterText( ctl.edgeplants, "10" );
      enterText( ctl.rocks, "15" );
      enterText( ctl.gravel, "14" );
      enterText( ctl.sandOrSilt, "13" );
      enterText( ctl.openwater, "11" );
      expect( ctl.nextButton.getView().touchEnabled ).to.be.true;
      clickButton( ctl.nextButton.getView() );
      expect( Alloy.Models.sample.get("boulder") ).to.equal(15);
      expect( Alloy.Models.sample.get("gravel") ).to.equal(14);
      expect( Alloy.Models.sample.get("sandOrSilt") ).to.equal(13);
      expect( Alloy.Models.sample.get("wood") ).to.equal(8);
      expect( Alloy.Models.sample.get("leafPacks") ).to.equal(17);
      expect( Alloy.Models.sample.get("aquaticPlants") ).to.equal(12);
      expect( Alloy.Models.sample.get("openWater") ).to.equal(11);
      expect( Alloy.Models.sample.get("edgePlants") ).to.equal(10);

    } ) );
  });
});
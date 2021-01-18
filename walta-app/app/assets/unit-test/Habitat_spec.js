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
describe.only("Habitat controller", function() {
    var ctl;
    this.timeout(6000);
	beforeEach( function() {
    Alloy.Models.instance("sample").clear();
		
	});
	afterEach( function(done) {
		closeWindow( ctl.getView(), done );
	});
	it('should display the Habitat view', function(done) { 
    ctl = Alloy.createController("Habitat");
    controllerOpenTest( ctl, done );
    
  });
  it('should persist habitat values', function(done) { 
    ctl = Alloy.createController("Habitat");
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
      expect( ctl.nextButton.isEnabled() ).to.be.true;
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

  it('should only allow data entry with 100% sum of habitats', function(done){
    ctl = Alloy.createController("Habitat");
    controllerOpenTest( ctl, () => checkTestResult( done, function() {
      expect( ctl.nextButton.isEnabled(), "nextButton should be enabled with sum to 100%" ).to.be.false;
      enterText( ctl.leaves, "17" );
      enterText( ctl.plants, "12" );
      enterText( ctl.wood, "8" );
      enterText( ctl.edgeplants, "10" );
      enterText( ctl.rocks, "15" );
      enterText( ctl.gravel, "14" );
      enterText( ctl.sandOrSilt, "13" );
      enterText( ctl.openwater, "11" );
      expect( ctl.nextButton.isEnabled(), "nextButton should be enabled with sum to 100%" ).to.be.true;

      enterText( ctl.openwater, "55" );
      expect( ctl.nextButton.isEnabled(), "nextButton should be disabled with sum > 100%" ).to.be.false;

      enterText( ctl.openwater, "4" );
      expect( ctl.nextButton.isEnabled(), "nextButton should be disabled with sum < 100%"  ).to.be.false;
    } ) );
  });
  it('should allow Next to be pressed in read only mode even with bad values', function(done){
    ctl = Alloy.createController("Habitat", {readonly:true});
    controllerOpenTest( ctl, () => checkTestResult( done, function() {
      expect( ctl.nextButton.isEnabled(), "nextButton should be enabled with sum to 100%" ).to.be.true;
      enterText( ctl.leaves, "17" );
      enterText( ctl.plants, "12" );
      enterText( ctl.wood, "8" );
      enterText( ctl.edgeplants, "10" );
      enterText( ctl.rocks, "15" );
      enterText( ctl.gravel, "14" );
      enterText( ctl.sandOrSilt, "13" );
      enterText( ctl.openwater, "11" );
      expect( ctl.nextButton.isEnabled(), "nextButton should be enabled with sum to 100%" ).to.be.true;

      enterText( ctl.openwater, "55" );
      expect( ctl.nextButton.isEnabled(), "nextButton should be enabled with sum > 100%" ).to.be.true;

      enterText( ctl.openwater, "4" );
      expect( ctl.nextButton.isEnabled(), "nextButton should be enabled with sum < 100%"  ).to.be.true;
    } ) );

  });
  it('should enable all the edit fields', function(done) {
    ctl = Alloy.createController("Habitat");
    controllerOpenTest( ctl, () => checkTestResult( done, function() {
      expect( ctl.leaves.editable ).to.be.undefined;
      expect( ctl.plants.editable ).to.be.undefined;
      expect( ctl.wood.editable ).to.be.undefined;
      expect( ctl.edgeplants.editable ).to.be.undefined;
      expect( ctl.rocks.editable ).to.be.undefined;
      expect( ctl.gravel.editable ).to.be.undefined;
      expect( ctl.sandOrSilt.editable ).to.be.undefined;
      expect( ctl.openwater.editable ).to.be.undefined;
    } ) );
  });
  it('should disable all the edit fields in readonly mode', function(done) {
    ctl = Alloy.createController("Habitat",{ readonly:true });
    controllerOpenTest( ctl, () => checkTestResult( done, function() {
      expect( ctl.leaves.editable ).to.be.false;
      expect( ctl.plants.editable ).to.be.false;
      expect( ctl.wood.editable ).to.be.false;
      expect( ctl.edgeplants.editable ).to.be.false;
      expect( ctl.rocks.editable ).to.be.false;
      expect( ctl.gravel.editable ).to.be.false;
      expect( ctl.sandOrSilt.editable ).to.be.false;
      expect( ctl.openwater.editable ).to.be.false;
    } ) );
  });


});
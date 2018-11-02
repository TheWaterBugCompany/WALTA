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
var { closeWindow, controllerOpenTest } = require("specs/util/TestUtils");
var mocx = require("specs/lib/mocx");
describe("Sample model", function() {
	var ctl;
	beforeEach( function() {
        Alloy.Models.sample = Alloy.Models.instance("sample");
        Alloy.Models.sample.set("waterbodyName","Test Waterbody");
        Alloy.Models.sample.set("nearbyFeature", "near the office intersection cupboard");
        Alloy.Models.sample.set( "dateCompleted", Date.now() );
        Alloy.Models.sample.set( "surveyType", 0 );
        Alloy.Models.sample.saveCurrentSample = function() {};
        Alloy.Models.sample.loadTaxa = function() { return []; };
        Alloy.Globals.CerdiApi = {};
        Alloy.Globals.CerdiApi.retrieveUserToken = function() {return "token"; };
    });
  
  function newTaxa(id, ab) {
    return Alloy.createModel("taxa", { taxonId: id, abundance: ab } );
  }

  var key = {
    findTaxonById( id ) { 
      var obj = null;
      if ( id == "193" ) {
        obj = { signalScore: 5 };
      } else if ( id == "22" ) {
        obj =  { signalScore: 10 };
      }
      Ti.API.info(`lookup ${id} (${typeof(id)}) ${JSON.stringify(obj)}`);
      return obj;
    }
  }

	
	it('should the calculate the correct SIGNAL score ', function() {
    var taxa = [ newTaxa("193", "1-2" ), newTaxa("22", "11-20" ) ];
    expect( Alloy.Models.sample.calculateSignalScore(taxa,key) ).to.equal("7.5");
  });

  it('should the calculate the correct weighted SIGNAL score ', function() {
    var taxa = [ newTaxa("193", "1-2" ), newTaxa("22", "11-20" ) ];
		expect( Alloy.Models.sample.calculateWeightedSignalScore(taxa,key) ).to.equal("9.4");
  });

  it('should the calculate the correct weighted SIGNAL score with >20 ', function() {
    var taxa = [ newTaxa("193", "1-2" ), newTaxa("22", "> 20" ) ];
		expect( Alloy.Models.sample.calculateWeightedSignalScore(taxa,key) ).to.equal("9.7"); 
  });
});
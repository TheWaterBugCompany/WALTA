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
var moment = require("lib/moment");
require("unit-test/lib/ti-mocha");
var { use, expect } = require("unit-test/lib/chai");
var { makeTestPhoto, removeDatabase, resetSample, clearDatabase  } = require("unit-test/util/TestUtils");
use( require('unit-test/lib/chai-date-string') );
var Sample = require('logic/Sample');

describe("Taxa model", function() {
  beforeEach( function() {
    clearDatabase();
  })
  it('should persist a taxon', function() {
    // create taxa model
    var taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666 );
    taxon.set("abundance", "> 20");
    taxon.set("taxonId", 1 );
    taxon.set("taxonPhotoPath", makeTestPhoto("test-photo.jpg"));
    taxon.save();

    // clear out of memory the taxa and fetch from database
    taxon = null;
    taxon = Alloy.createModel("taxa");
    taxon.fetch({query: "SELECT * FROM taxa WHERE sampleId = 666 AND taxonId = 1"});

    expect( taxon.get("sampleId") ).to.equal(666);
    expect( taxon.get("taxonId") ).to.equal(1);
    expect( taxon.get("abundance") ).to.equal("> 20");

    // should rename photo path to correct name
    expect( taxon.get("taxonPhotoPath")).to.include("taxon_666_1");
  });
  it('should persist a taxon with the same id into two different sample ids', function() {
    // create taxa model
    var taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666 );
    taxon.set("taxonId", 1 );
    taxon.set("abundance", "1-2");
    taxon.set("taxonPhotoPath", makeTestPhoto("test-photo-666.jpg"));
    taxon.save();

    taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 667 );
    taxon.set("taxonId", 1 );
    taxon.set("abundance", "3-4");
    taxon.set("taxonPhotoPath", makeTestPhoto("test-photo-667.jpg"));
    taxon.save();

    // clear out of memory the taxa and fetch from database
    taxon = Alloy.createModel("taxa");
   
    taxon = null;
    taxon = Alloy.createModel("taxa");
    taxon.fetch({query: "SELECT * FROM taxa WHERE sampleId = 666 AND taxonId = 1"});
    console.log(taxon);
    expect( taxon.get("sampleId") ).to.equal(666);
    expect( taxon.get("taxonId") ).to.equal(1);
    expect( taxon.get("abundance") ).to.equal("1-2");
    expect( taxon.get("taxonPhotoPath") ).to.include("taxon_666_1");

    taxon.fetch({query: "SELECT * FROM taxa WHERE sampleId = 667 AND taxonId = 1"});
    expect( taxon.get("sampleId") ).to.equal(667);
    expect( taxon.get("taxonId") ).to.equal(1);
    expect( taxon.get("abundance") ).to.equal("3-4");
    expect( taxon.get("taxonPhotoPath") ).to.include("taxon_667_1");
  });
});
describe("Sample collection, model including taxa", function() {
  var initialSampleId;
	beforeEach( function() {
    resetSample();

    // set initial sample fields
    Alloy.Models.sample.set("serverSampleId", 666);
    Alloy.Models.sample.set("lastError", "Test error");
    Alloy.Models.sample.set("lat", -42.0 );
    Alloy.Models.sample.set("lng", 135.0 );
    Alloy.Models.sample.set("accuracy", 100.0 );
    Alloy.Models.sample.set("surveyType", Sample.SURVEY_DETAILED);
    Alloy.Models.sample.set("waterbodyType", Sample.WATERBODY_LAKE);
    Alloy.Models.sample.set("waterbodyName","Test Waterbody");
    Alloy.Models.sample.set("nearbyFeature", "near the office intersection cupboard");
    Alloy.Models.sample.set("boulder", 15 );
    Alloy.Models.sample.set("gravel", 14 );
    Alloy.Models.sample.set("sandOrSilt", 13 );
    Alloy.Models.sample.set("wood", 8 );
    Alloy.Models.sample.set("leafPacks", 17 );
    Alloy.Models.sample.set("aquaticPlants", 12 );
    Alloy.Models.sample.set("openWater", 11 );
    Alloy.Models.sample.set("edgePlants", 10 );
    Alloy.Models.sample.set("sitePhotoPath", "/photo/path" );
    Alloy.Models.sample.set("uploaded", true );
    Alloy.Models.sample.save(); // set the autoincremented sampleId
    initialSampleId = Alloy.Models.sample.get("sampleId");
    
    // add some taxons
    [ 1, 2, 3, 4, 5 ].forEach( (taxonId) => { 
        let taxon = Alloy.createModel("taxa", { 
          sampleId:  Alloy.Models.sample.get("sampleId"),
          taxonId: taxonId, 
          abundance: ["1-2","3-4","5-9","10-15",">20"][taxonId-1]
          });
        taxon.save();
        Alloy.Collections.taxa.add(taxon);
    });

    // add the sample to the sample collection
    Alloy.Collections.sample.add(Alloy.Models.sample);
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
      Ti.API.debug(`lookup ${id} (${typeof(id)}) ${JSON.stringify(obj)}`);
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

  it('should load a blank sample when database is empty and load() is called', function() {
      // ensure database is empty
      let samples = Ti.Database.open("samples");
      samples.execute("DELETE FROM sample");
      samples.execute("DELETE FROM taxa");

      // reset global instances
      Alloy.Models.sample = null;
      Alloy.Models.taxa = null;
      Alloy.Collections.sample = null;
      Alloy.Collections.taxa = null;

      // create a new sample
      Alloy.Collections.instance("sample").load();

      expect( Alloy.Collections.sample.length ).to.equal(0);
      expect( Alloy.Collections.taxa.length ).to.equal(0);
  });

  context('should correctly persist sample', function() {
    beforeEach(function() {
      Alloy.Models.sample.saveCurrentSample();
      resetSample();
      Alloy.Models.sample.loadById(initialSampleId);
    })   
    it('should persist all the fields', function() {
      expect( Alloy.Models.sample.get("serverSampleId") ).to.equal(666);
      expect( Alloy.Models.sample.get("sampleId") ).to.equal(initialSampleId);
      expect( Alloy.Models.sample.get("lastError") ).to.equal("Test error");
      expect( Alloy.Models.sample.get("dateCompleted")).to.be.a.dateString();
      expect( parseFloat(Alloy.Models.sample.get("lat")) ).to.equal(-42);
      expect( parseFloat(Alloy.Models.sample.get("lng")) ).to.equal(135);
      expect( Alloy.Models.sample.get("accuracy") ).to.equal(100.0);
      expect( Alloy.Models.sample.get("surveyType") ).to.equal(Sample.SURVEY_DETAILED);
      expect( Alloy.Models.sample.get("waterbodyType") ).to.equal(Sample.WATERBODY_LAKE);
      expect( Alloy.Models.sample.get("waterbodyName") ).to.equal("Test Waterbody");
      expect( Alloy.Models.sample.get("nearbyFeature") ).to.equal("near the office intersection cupboard");
      expect( Alloy.Models.sample.get("boulder") ).to.equal(15);
      expect( Alloy.Models.sample.get("gravel") ).to.equal(14);
      expect( Alloy.Models.sample.get("sandOrSilt") ).to.equal(13);
      expect( Alloy.Models.sample.get("wood") ).to.equal(8);
      expect( Alloy.Models.sample.get("leafPacks") ).to.equal(17);
      expect( Alloy.Models.sample.get("aquaticPlants") ).to.equal(12);
      expect( Alloy.Models.sample.get("openWater") ).to.equal(11);
      expect( Alloy.Models.sample.get("edgePlants") ).to.equal(10);
      expect( Alloy.Models.sample.get("sitePhotoPath") ).to.equal("/photo/path");
      expect( Alloy.Models.sample.get("uploaded") ).to.be.ok;
    });
    it('should persist all the taxons', function() {
      expect( Alloy.Collections.taxa.length ).to.equal(5);
      [ 1, 2, 3, 4, 5 ].forEach( (taxonId) => {
        let taxon = Alloy.Collections.taxa.at(taxonId-1);
        expect( taxon.get("taxonId") ).to.equal(taxonId); 
      }); 
    });
  });

  context('should reset sample when new sample is created', function() {
    beforeEach(function() {
      Alloy.Collections.sample.createNewSample();
    });
    it('should reset the current sample fields', function() {
      expect( Alloy.Models.sample.get("serverSampleId") ).to.be.undefined;
      expect( Alloy.Models.sample.get("lastError") ).to.be.undefined;
      expect( Alloy.Models.sample.get("sampleId") ).to.not.equal(initialSampleId);
      expect( Alloy.Models.sample.get("dateCompleted") ).to.be.undefined;
      expect( Alloy.Models.sample.get("lat") ).to.be.undefined;
      expect( Alloy.Models.sample.get("lng") ).to.be.undefined;
      expect( Alloy.Models.sample.get("accuracy") ).to.be.undefined;
      expect( Alloy.Models.sample.get("surveyType") ).to.be.undefined;
      expect( Alloy.Models.sample.get("waterbodyType") ).to.be.undefined;
      expect( Alloy.Models.sample.get("waterbodyName") ).to.be.undefined;
      expect( Alloy.Models.sample.get("nearbyFeature") ).to.be.undefined;
      expect( Alloy.Models.sample.get("boulder") ).to.be.undefined;
      expect( Alloy.Models.sample.get("gravel") ).to.be.undefined;
      expect( Alloy.Models.sample.get("sandOrSilt") ).to.be.undefined;
      expect( Alloy.Models.sample.get("wood") ).to.be.undefined;
      expect( Alloy.Models.sample.get("aquaticPlants") ).to.be.undefined;
      expect( Alloy.Models.sample.get("openWater") ).to.be.undefined;
      expect( Alloy.Models.sample.get("edgePlants") ).to.be.undefined;
      expect( Alloy.Models.sample.get("sitePhotoPath") ).to.be.undefined;
      expect( Alloy.Models.sample.get("uploaded") ).to.be.undefined;
    });
    it('should reset the taxa collection', function() {
      expect( Alloy.Collections.taxa.length ).to.equal(0);
    });
    
  });
  context('should serialise correctly', function() {
    beforeEach(function() {
      Alloy.Models.sample.saveCurrentSample();
    });
    it('should serialize mayfly survey type correctly', function() {
      Alloy.Models.sample.set("surveyType", Sample.SURVEY_MAYFLY);
      expect( Alloy.Models.sample.toCerdiApiJson().survey_type ).to.equal("mayfly");

    });
    it('should serialize quick survey type correctly', function() {
      Alloy.Models.sample.set("surveyType", Sample.SURVEY_ORDER);
      expect( Alloy.Models.sample.toCerdiApiJson().survey_type ).to.equal("quick");
      
    });
    it('should serialize detailed survey type correctly', function() {
      Alloy.Models.sample.set("surveyType", Sample.SURVEY_DETAILED);
      expect( Alloy.Models.sample.toCerdiApiJson().survey_type ).to.equal("detailed");
      
    });
    it('should serialize wetland survey type correctly', function() {
      Alloy.Models.sample.set("waterbodyType", Sample.WATERBODY_WETLAND);
      expect( Alloy.Models.sample.toCerdiApiJson().waterbody_type ).to.equal("wetland");

    });
    it('should serialize river waterbody type correctly', function() {
      Alloy.Models.sample.set("waterbodyType", Sample.WATERBODY_RIVER);
      expect( Alloy.Models.sample.toCerdiApiJson().waterbody_type ).to.equal("river");
      
    });
    it('should serialize lake waterbody type correctly', function() {
      Alloy.Models.sample.set("waterbodyType", Sample.WATERBODY_LAKE);
      expect( Alloy.Models.sample.toCerdiApiJson().waterbody_type ).to.equal("lake");
      
    });
    it('should serilaize attributes correctly', function() {
      var json = Alloy.Models.sample.toCerdiApiJson();
      expect( json ).to.be.ok;
      expect( json.sample_date ).to.be.a.dateString();
      expect( json.lat ).to.equal('-42.00000');
      expect( json.lng ).to.equal('135.00000');
      expect( json.scoring_method ).to.equal("alt");
      expect( json.survey_type ).to.equal("detailed");
      expect( json.waterbody_type ).to.equal("lake");
      expect( json.waterbody_name ).to.equal("Test Waterbody");
      expect( json.nearby_feature).to.equal("near the office intersection cupboard");
      expect( json.habitat.boulder ).to.equal(15);
      expect( json.habitat.gravel ).to.equal(14);
      expect( json.habitat.sandOrSilt ).to.equal(13);
      expect( json.habitat.wood ).to.equal(8);
      expect( json.habitat.leafPacks ).to.equal(17);
      expect( json.habitat.aquaticPlants ).to.equal(12);
      expect( json.habitat.openWater ).to.equal(11);
      expect( json.habitat.edgePlants ).to.equal(10);
    });

    it('should serilaize taxa correctly', function() {
      var json = Alloy.Models.sample.toCerdiApiJson();
      expect( json ).to.be.ok;
      var taxa = json.creatures;
      [[1,2],[2,4],[3,7],[4,13],[5,30]]
        .forEach( ([taxonId,abundance]) => {
          expect(taxa[taxonId-1].creature_id, "creature id").to.equal(taxonId);
          expect(taxa[taxonId-1].count, "count").to.equal(abundance);
        });
    });

    it('should serilaize server id correctly correctly', function() {
      Alloy.Models.sample.set('serverSampleId', 99 );
      var json = Alloy.Models.sample.toCerdiApiJson();
      expect( json ).to.be.ok;
      expect( json.sampleId ).to.equal(99);
    });
  });
});
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
var { makeSampleData } = require("unit-test/fixtures/SampleData_fixture");

var { makeTestPhoto, removeDatabase, resetSample, clearDatabase, waitForTick  } = require("unit-test/util/TestUtils");
use( require('unit-test/lib/chai-date-string') );
var Sample = require('logic/Sample');

describe("Taxa collection", function() {
  it('should not duplicate taxa when updated with fromCerdiApiJson', function() {
    var taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666 );
    taxon.set("abundance", "> 20");
    taxon.set("taxonId", 1 );
    taxon.set("taxonPhotoPath", makeTestPhoto("test-photo.jpg"));
    taxon.save();
    var taxa = Alloy.createCollection("taxa");
    taxa.load(666);
    expect( taxa.size() ).to.equal(1);

    taxa.fromCerdiApiJson([{
      creature_id: 1,
      count: 15
    }],666);

    // should update existing taxon rather than create a new record
    taxa.load(666);
    expect( taxa.size() ).to.equal(1);



  
  })
});

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

  function verifyTaxa(taxas,sampleId) {
    expect( taxas.length ).to.equal(5);
    [ 1, 2, 3, 4, 5 ].forEach( (taxonId) => { 
      let taxa = taxas.at(taxonId-1);
      expect(taxa.get("sampleId")).to.equal(sampleId);
      expect(taxa.get("abundance")).to.equal(["1-2","3-5","6-10","11-20","> 20"][taxonId-1]);
      expect(taxa.get("taxonId")).to.equal(taxonId);
      expect(taxa.get("taxonPhotoPath")).to.include(`taxon-${taxonId-1}.jpg`);
      expect(taxa.get("serverCreaturePhotoId")).to.equal(taxonId+100);
    });
  }

	beforeEach( function() {
    clearDatabase();

    // set initial sample fields
    Alloy.Models.sample = makeSampleData({
      serverSampleId: 666,
      lastError: "Test error",
      lat: -42.0,
      lng: 135.0,
      complete: true,
      notes: "test notes",
      accuracy: "100.0",
      surveyType: Sample.SURVEY_DETAILED,
      waterbodyType: Sample.WATERBODY_LAKE,
      waterbodyName: "Test Waterbody",
      nearbyFeature: "near the office intersection cupboard",
      serverSyncTime: moment().valueOf() 
    });
   
    Alloy.Models.sample.save(); // set the autoincremented sampleId
    initialSampleId = Alloy.Models.sample.get("sampleId");
    
    // add some taxons
    [ 1, 2, 3, 4, 5 ].forEach( (taxonId) => { 
        let taxon = Alloy.createModel("taxa", { 
          sampleId:  Alloy.Models.sample.get("sampleId"),
          taxonId: taxonId, 
          abundance: ["1-2","3-5","6-10","11-20","> 20"][taxonId-1],
          taxonPhotoPath: makeTestPhoto(`taxon-${taxonId-1}.jpg`),
          serverCreaturePhotoId: taxonId+100
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

  it('should not load any temporary rows when loading by serverSampleId', function() {
    // since we use retrieve by serverSampleId to load the latest record
    // this needs to exclude any records that are currently temporary and must not
    // be treated as a submitted sample.
    var tempModel = Alloy.Models.sample.createTemporaryForEdit();
    tempModel.set("waterbodyName","temporary waterbody");
    tempModel.save();
    var model = Alloy.createModel("sample");
    model.loadByServerId(666);
    expect( model.get("waterbodyName"), "should load old model not temporary").to.equal("Test Waterbody");
  });

  it('should load a blank sample when database is empty and load() is called', async function() {
      clearDatabase();
      await Alloy.Models.instance("sample").loadCurrent();
      Alloy.Collections.taxa = Alloy.Models.instance("sample").loadTaxa();
      expect( Alloy.Collections.sample.length ).to.equal(0);
      expect( Alloy.Collections.taxa.length ).to.equal(0);

  });

  context('should correctly persist sample', function() {
    let taxa;
    let sample;
    beforeEach(function() {
      sample = Alloy.createModel("sample");
      sample.loadById(initialSampleId);
      taxa = sample.loadTaxa();
    })   
    
    it('should persist all the fields', function() {
      expect( sample.get("complete"), "complete field" ).to.equal(1);
      expect( sample.get("notes"), "notes field").to.equal("test notes");
      expect( sample.get("serverSampleId") ).to.equal(666);
      expect( sample.get("sampleId") ).to.equal(initialSampleId);
      expect( sample.get("lastError") ).to.equal("Test error");
      expect( sample.get("dateCompleted")).to.be.a.dateString();
      expect( parseFloat(sample.get("lat")) ).to.equal(-42);
      expect( parseFloat(sample.get("lng")) ).to.equal(135);
      expect( sample.get("accuracy") ).to.equal('100.0');
      expect( sample.get("surveyType") ).to.equal(Sample.SURVEY_DETAILED);
      expect( sample.get("waterbodyType") ).to.equal(Sample.WATERBODY_LAKE);
      expect( sample.get("waterbodyName") ).to.equal("Test Waterbody");
      expect( sample.get("nearbyFeature") ).to.equal("near the office intersection cupboard");
      expect( sample.get("boulder") ).to.equal(15);
      expect( sample.get("gravel") ).to.equal(14);
      expect( sample.get("sandOrSilt") ).to.equal(13);
      expect( sample.get("wood") ).to.equal(8);
      expect( sample.get("leafPacks") ).to.equal(17);
      expect( sample.get("aquaticPlants") ).to.equal(12);
      expect( sample.get("openWater") ).to.equal(11);
      expect( sample.get("edgePlants") ).to.equal(10);
      expect( sample.get("sitePhotoPath") ).to.include("sitephoto.jpg");
      expect( sample.get("serverSyncTime") ).to.be.ok;
    });
    it('should persist all the taxons', function() {
      expect( taxa.length ).to.equal(5);
      [ 1, 2, 3, 4, 5 ].forEach( (taxonId) => {
        let taxon = taxa.at(taxonId-1);
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
      expect( Alloy.Models.sample.get("serverSyncTime") ).to.be.undefined;
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
    it('should serialize notes correctly', function() {
      Alloy.Models.sample.set("notes", "test notes");
      var json = Alloy.Models.sample.toCerdiApiJson();
      expect( json.notes ).to.equal("test notes");
    });
    it('should serialize partial correctly', function() {
      Alloy.Models.sample.set("complete", true);
      var json = Alloy.Models.sample.toCerdiApiJson();
      expect( json.complete ).to.equal(true);
      Alloy.Models.sample.set("complete", false);
      var json = Alloy.Models.sample.toCerdiApiJson();
      expect( json.complete ).to.equal(false);
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
      expect( json.habitat.sand_or_silt ).to.equal(13);
      expect( json.habitat.wood ).to.equal(8);
      expect( json.habitat.leaf_packs ).to.equal(17);
      expect( json.habitat.aquatic_plants ).to.equal(12);
      expect( json.habitat.open_water ).to.equal(11);
      expect( json.habitat.edge_plants ).to.equal(10);
    });

    it('should serialize taxa correctly', function() {
      var json = Alloy.Models.sample.toCerdiApiJson();
      expect( json ).to.be.ok;
      var taxa = json.creatures;
      [[1,2],[2,4],[3,8],[4,16],[5,30]]
        .forEach( ([taxonId,abundance]) => {
          expect(taxa[taxonId-1].creature_id, "creature id").to.equal(taxonId);
          expect(taxa[taxonId-1].count, "count").to.equal(abundance);
        });
    });

    

    it('should serialize server id correctly correctly', function() {
      Alloy.Models.sample.set('serverSampleId', 99 );
      var json = Alloy.Models.sample.toCerdiApiJson();
      expect( json ).to.be.ok;
      expect( json.id ).to.equal(99);
    }); 

    
    

    /*context("set updatedAt", function() { 
    [
      "dateCompleted",
      "lat",
      "lng",
      "accuracy",
      "surveyType",
      "waterbodyType",
      "waterbodyName",
      "nearbyFeature",
      "boulder",
      "gravel",
      "sandOrSilt",
      "leafPacks",
      "wood",
      "aquaticPlants",
      "openWater",
      "edgePlants",
      "sitePhotoPath"
    ].forEach( field => 
      it(`should set the updatedAt field to the lastest date afer ${field} field is set`,function(done) {
        
        let sample = Alloy.Models.sample;
        let oldUpdatedAt = 10000;
        sample.set("updatedAt", oldUpdatedAt);
        sample.set(field, 'updated');
        _.defer(() => {
            expect(sample.get('updatedAt')).to.be.above(oldUpdatedAt);
            done();
        });
      }));
    });*/
  });
 

  it('should create a temporary copy correctly', function() {
    Alloy.Models.sample.set('serverSampleId', 99 );
    let sample = Alloy.Models.sample;
    let tempSample = sample.createTemporaryForEdit();
    expect( tempSample.get("serverSampleId")).to.equal(99);
    expect( tempSample.get("dateCompleted")).to.be.undefined;

    expect( tempSample.get("lastError") ).to.be.undefined;
    expect( tempSample.get("sampleId") ).not.to.equal(sample.get("sampleId"));
    expect( tempSample.get("lat") ).to.equal(sample.get("lat"));
    expect( tempSample.get("lng") ).to.equal(sample.get("lng"));
    expect( tempSample.get("accuracy") ).to.equal(sample.get("accuracy"));
    expect( tempSample.get("surveyType") ).to.equal(sample.get("surveyType"));
    expect( tempSample.get("waterbodyType") ).to.equal(sample.get("waterbodyType"));
    expect( tempSample.get("waterbodyName") ).to.equal(sample.get("waterbodyName"));
    expect( tempSample.get("nearbyFeature") ).to.equal(sample.get("nearbyFeature"));
    expect( tempSample.get("boulder") ).to.equal(sample.get("boulder"));
    expect( tempSample.get("gravel") ).to.equal(sample.get("gravel"));
    expect( tempSample.get("sandOrSilt") ).to.equal(sample.get("sandOrSilt"));
    expect( tempSample.get("wood") ).to.equal(sample.get("wood"));
    expect( tempSample.get("aquaticPlants") ).to.equal(sample.get("aquaticPlants"));
    expect( tempSample.get("openWater") ).to.equal(sample.get("openWater"));
    expect( tempSample.get("edgePlants") ).to.equal(sample.get("edgePlants"));
    expect( tempSample.get("sitePhotoPath") ).to.equal(sample.get("sitePhotoPath"));
    expect( tempSample.get("serverSyncTime") ).to.equal(sample.get("serverSyncTime"));

    // check all the taxons have been copied too.
    verifyTaxa( tempSample.loadTaxa(), tempSample.get("sampleId") );
  });

  it('saveCurrentSample should overwrite existing record with temporary record', async function() {

    function rowCount() {
      var coll = Alloy.createCollection("sample");
      coll.fetch({query:"SELECT * FROM sample WHERE serverSampleId = 99"});
      return coll.length;
    }
    Alloy.Models.sample.set('serverSampleId', 99 );
  
    // need to set dateCompleted to ensure duplicate is created.
    // in actual usage 
    Alloy.Models.sample.set("dateCompleted", moment().valueOf());
    Alloy.Models.sample.save();
    
    let tempSample = Alloy.Models.sample.createTemporaryForEdit();
    let tempTaxa = tempSample.loadTaxa();
    tempSample.set("waterbodyName", "edited");

    // remove old taxon
    tempTaxa.at(0).destroy(); 

    // add new taxons
    Alloy.createModel("taxa",{ 
      sampleId:  tempSample.get("sampleId"),
      taxonId: 99, 
      abundance: "> 20",
      taxonPhotoPath: makeTestPhoto(`taxon-98.jpg`)
      }).save();

    Alloy.createModel("taxa",{ 
      sampleId:  tempSample.get("sampleId"),
      taxonId: 66, 
      abundance: "1-2",
      taxonPhotoPath: makeTestPhoto(`taxon-65.jpg`)
      }).save();

    tempSample.save();

    expect(rowCount(),"there should be 2 rows, the orginal, and the copy").to.equal(2);

    // check old row still exists
    let oldSample = Alloy.createModel("sample");
    oldSample.loadByServerId(99);
    expect(oldSample.get("waterbodyName")).to.equal("Test Waterbody");
    verifyTaxa(oldSample.loadTaxa(), oldSample.get("sampleId"));
   
    tempSample.saveCurrentSample();

    // should be updated
    var sample = Alloy.createModel("sample");
    sample.loadByServerId(99);
    expect( sample.get("waterbodyName")).to.equal("edited"); 

    // verify updated mixture of taxons
    let sampleId = sample.get('sampleId');
    let taxas = sample.loadTaxa();
    expect( taxas.length ).to.equal(6);
    let index = 0;
    [ 2, 3, 4, 5, 99, 66 ].forEach( (taxonId) => { 
      let taxa = taxas.at(index);
      expect(taxa.get("sampleId")).to.equal(sampleId);
      expect(taxa.get("abundance")).to.equal(["3-5","6-10","11-20","> 20","> 20","1-2"][index]);
      expect(taxa.get("taxonId"),"taxonId").to.equal(taxonId);
      expect(taxa.get("taxonPhotoPath")).to.include(`taxon-${taxonId-1}.jpg`);
      if ( taxonId !== 66 && taxonId !== 99 ) {
        expect(taxa.get("serverCreaturePhotoId")).to.equal(taxonId+100);
      }
      index++;
    });

    expect(rowCount(),"the old copy should be removed").to.equal(1);

  });

  context("user filtering of sample records", function() {
    it('should filter out any records not belonging to the current user from upload queue', function() {
      makeSampleData({ serverUserId: 123, serverSampleId: 666}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 667}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 668}).save();
      var coll = Alloy.createCollection("sample");
      coll.loadUploadQueue(224);
      expect(coll.size()).to.equal(2);

    });

    it('should NOT filter out records that have no user but also not uploaded yet from upload queue', function() {
      makeSampleData({ serverUserId: 123, serverSampleId: 666}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 667}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 668}).save();
      makeSampleData({ serverUserId: null, serverSampleId: null}).save();
      var coll = Alloy.createCollection("sample");
      coll.loadUploadQueue(224);
      expect(coll.size()).to.equal(3);
    });

    it('should filter records to NULL user ids from upload queue', function() {
      makeSampleData({ serverUserId: 123, serverSampleId: 666}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 667}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 668}).save();
      makeSampleData({ serverUserId: null, serverSampleId: 669}).save();
      makeSampleData({ serverUserId: null, serverSampleId: 670}).save();
      makeSampleData({ serverUserId: null, serverSampleId: 671}).save();
      var coll = Alloy.createCollection("sample");
      coll.loadUploadQueue(null);
      expect(coll.size()).to.equal(3);
    });

    it('should filter out any records not belonging to the current user', function() {
      makeSampleData({ serverUserId: 123, serverSampleId: 666}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 667}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 668}).save();
      var coll = Alloy.createCollection("sample");
      coll.loadSampleHistory(224);
      expect(coll.size()).to.equal(2);

    });

    it('should NOT filter out records that have no user but also not uploaded yet', function() {
      makeSampleData({ serverUserId: 123, serverSampleId: 666}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 667}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 668}).save();
      makeSampleData({ serverUserId: null, serverSampleId: null}).save();
      var coll = Alloy.createCollection("sample");
      coll.loadSampleHistory(224);
      expect(coll.size()).to.equal(3);
    });

    it('should filter records to NULL user ids ', function() {
      makeSampleData({ serverUserId: 123, serverSampleId: 666}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 667}).save();
      makeSampleData({ serverUserId: 224, serverSampleId: 668}).save();
      makeSampleData({ serverUserId: null, serverSampleId: 669}).save();
      makeSampleData({ serverUserId: null, serverSampleId: 670}).save();
      makeSampleData({ serverUserId: null, serverSampleId: 671}).save();
      var coll = Alloy.createCollection("sample");
      coll.loadSampleHistory(null);
      expect(coll.size()).to.equal(3);
    });
  });
});
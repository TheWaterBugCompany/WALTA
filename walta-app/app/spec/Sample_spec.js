var moment = require("lib/moment");

require("spec/lib/ti-mocha");
var simple = require("spec/lib/simple-mock");
var { use, expect } = require("spec/lib/chai");
var { makeSampleData } = require("spec/fixtures/SampleData_fixture");

var { makeTestPhoto, removeDatabase, resetSample, clearDatabase, waitForTick  } = require("spec/util/TestUtils");
use( require('spec/lib/chai-date-string') );
use( require('spec/lib/chai-falsy') );
var Sample = require('logic/Sample');

describe("Taxa collection", function() {
  beforeEach( function() { 
    clearDatabase();
  });
  function createMockTaxon(taxonId,willDelete) {
    var taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666 );
    taxon.set("abundance", "> 20");
    taxon.set("taxonId", taxonId );
    taxon.set("willDelete", willDelete);
    taxon.set("updatedAt", 0);
    taxon.save();
  }
  it('should compare two taxa collection', function() {
    let taxa1 = Alloy.createCollection("taxa");
    let taxa2 = Alloy.createCollection("taxa");

    expect( taxa1.equals(taxa2), "empty taxa" ).to.be.true;

    let taxon1a = Alloy.createModel("taxa", {
      sampleId: 666,
      abundance: "1-2",
      taxonId: 1,
      taxonPhotoPath: "photo1"
    });
    let taxon2a = Alloy.createModel("taxa", {
      sampleId: 123,
      abundance: "1-2",
      taxonId: 1,
      taxonPhotoPath: "photo1"
    });
    taxa1.push(taxon1a);
    taxa2.push(taxon2a);

    expect( taxa1.equals(taxa2), "with one taxon" ).to.be.true;

    let taxon1b = Alloy.createModel("taxa", {
      sampleId: 666,
      abundance: "> 20",
      taxonId: 1,
      taxonPhotoPath: "photo1"
    });
    let taxon2b = Alloy.createModel("taxa", {
      sampleId: 123,
      abundance: "> 20",
      taxonId: 1,
      taxonPhotoPath: "photo1"
    });
    taxa1.unshift(taxon1b);
    taxa2.push(taxon2b);

    expect( taxa1.equals(taxa2), "with two taxa in differing orders" ).to.be.true;

    taxon2b.set("taxonId", 99 );
    expect( taxa1.equals(taxa2), "one different taxon" ).to.be.false;

    taxon2b.set("taxonId", 1);

    let taxon2c = Alloy.createModel("taxa", {
      sampleId: 123,
      abundance: "> 20",
      taxonId: 55,
      taxonPhotoPath: "photo1"
    });
    taxa2.push(taxon2c); // differing lengths
    expect( taxa1.equals(taxa2), "different lengths" ).to.be.false;


  }),
  it('should filter out any taxons marked for deletion when loaded', function() {
    createMockTaxon(1,null);
    createMockTaxon(2,0);
    createMockTaxon(3,1);
    let taxa = Alloy.createCollection("taxa");
    taxa.load(666);
    expect( taxa.size(), "collection size" ).to.equal(2);
    expect( taxa.at(0).get("taxonId")).to.equal(1);
    expect( taxa.at(1).get("taxonId")).to.equal(2);
  });
  it('loadDeleted() should load all taxons flagged for deletion', function() {
    createMockTaxon(1,null);
    createMockTaxon(2,0);
    createMockTaxon(3,1);
    let taxa = Alloy.createCollection("taxa");
    taxa.loadPendingDelete(666);
    expect( taxa.size() ).to.equal(1);
    expect( taxa.at(0).get("taxonId")).to.equal(3);
  });
  it('should not duplicate taxa when updated with fromCerdiApiJson', function() {
    var taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666 );
    taxon.set("abundance", "> 20");
    taxon.set("taxonId", 1 );
    taxon.set("taxonPhotoPath", makeTestPhoto("test-photo.jpg"));
    taxon.set("updatedAt",0 );
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
  });

  it('should not duplicate unknown taxa when updated with fromCerdiApiJson when _sampleTaxonId is present', function() {
    let taxon1, taxon2;
    
    taxon1 = Alloy.createModel("taxa");

    taxon1.set("sampleId", 666 );
    taxon1.set("abundance", "> 20");
    taxon1.set("taxonId", null );
    taxon1.set("taxonPhotoPath", makeTestPhoto("test-photo-unknown.jpg"));
    taxon1.set("updatedAt", 0);
    taxon1.save();

    taxon2 = Alloy.createModel("taxa");
    taxon2.set("sampleId", 666 );
    taxon2.set("abundance", "1-2");
    taxon2.set("taxonId", null );
    taxon2.set("taxonPhotoPath", makeTestPhoto("test-photo-unknown-2.jpg"));
    taxon2.set("updatedAt", 0);
    taxon2.save();
    var taxa = Alloy.createCollection("taxa");
    taxa.load(666);

    taxa.fromCerdiApiJson([{
      _sampleTaxonId: taxon1.get("sampleTaxonId"),
      creature_id: null,
      count: 15
    }, {
      _sampleTaxonId: taxon2.get("sampleTaxonId"),
      creature_id: null,
      count: 8
    }],666);

    // should update existing taxon rather than create a new record
    taxa.load(666);
    expect( taxa.size(), "size of taxa collection" ).to.equal(2);
    expect( taxa.at(0).get("abundance")).to.equal("11-20");
    
    expect( taxa.at(1).get("abundance")).to.equal("6-10");

    expect( taxa.at(0).get("taxonPhotoPath")).to.include("test-photo-unknown.jpg");
    expect( taxa.at(1).get("taxonPhotoPath")).to.include("test-photo-unknown-2.jpg");
  });

  it('should not duplicate unknown taxa when updated with fromCerdiApiJson when serverCreatureId is present', async function() {
    clearDatabase();
    let taxon1, taxon2;
    
    taxon1 = Alloy.createModel("taxa");

    taxon1.set("sampleId", 666 );
    taxon1.set("abundance", "> 20");
    taxon1.set("taxonId", null );
    taxon1.set("serverCreatureId", 1);
    taxon1.set("taxonPhotoPath", makeTestPhoto("test-photo-unknown.jpg"));
    taxon1.set("updatedAt", 0);
    taxon1.save();

    taxon2 = Alloy.createModel("taxa");
    taxon2.set("sampleId", 666 );
    taxon2.set("abundance", "1-2");
    taxon2.set("taxonId", null );
    taxon2.set("serverCreatureId", 2);
    taxon2.set("taxonPhotoPath", makeTestPhoto("test-photo-unknown-2.jpg"));
    taxon2.set("updatedAt", 0);
    taxon2.save();
    var taxa = Alloy.createCollection("taxa");
    taxa.load(666);

    taxa.fromCerdiApiJson([{
      id: 1,
      creature_id: null,
      count: 15
    }, {
      id: 2,
      creature_id: null,
      count: 8
    }],666);

    

    // should update existing taxon rather than create a new record
    taxa.load(666);
    let json = taxa.toCerdiApiJson();
    expect( taxa.size(), "size of taxa collection" ).to.equal(2);
    expect( taxa.at(0).get("abundance")).to.equal("11-20");
    
    expect( taxa.at(1).get("abundance")).to.equal("6-10");

    expect( taxa.at(0).get("taxonPhotoPath")).to.include("test-photo-unknown.jpg");
    expect( taxa.at(1).get("taxonPhotoPath")).to.include("test-photo-unknown-2.jpg");
    
  });

  // WB-12: re-syncing a sample from the server must not wipe the
  // locally-stored serverCreaturePhotoId. The server doesn't echo
  // `_serverCreaturePhotoId` for known creatures, so reading it back as
  // null on every download makes findPendingUploads() flag every taxon
  // as pending — triggering an upload loop.
  it('should preserve serverCreaturePhotoId when re-syncing a known creature whose photo was already uploaded', function() {
    clearDatabase();
    let taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666);
    taxon.set("abundance", "> 20");
    taxon.set("taxonId", 1);
    taxon.set("serverCreatureId", 9067);
    taxon.set("serverCreaturePhotoId", 12345);
    taxon.set("taxonPhotoPath", makeTestPhoto("test-photo.jpg"));
    taxon.set("updatedAt", 0);
    taxon.save();

    let taxa = Alloy.createCollection("taxa");
    taxa.load(666);

    // simulate a real server response — `_serverCreaturePhotoId` is absent
    // because the server treats `_`-prefixed fields as private to the client.
    taxa.fromCerdiApiJson([{
      id: 9067,
      creature_id: 1,
      count: 25,
      photos_count: 1
    }], 666);

    taxa.load(666);
    expect(taxa.size(), "size of taxa collection").to.equal(1);
    expect(taxa.at(0).get("serverCreaturePhotoId"), "serverCreaturePhotoId should be preserved across re-sync").to.equal(12345);
  });

  it('should return taxons pending upload', function() {
    clearDatabase();
    let taxon1, taxon2,taxon3;
    
    taxon1 = Alloy.createModel("taxa");

    taxon1.set("sampleId", 666 );
    taxon1.set("abundance", "> 20");
    taxon1.set("taxonId", null );
    taxon1.set("serverCreatureId", 1);
    taxon1.set("taxonPhotoPath", makeTestPhoto("test-photo-unknown.jpg"));
    taxon1.set("serverCreaturePhotoId", 99);
    taxon1.set("updatedAt", 0);
    taxon1.save();

    // serverCreaturePhotoId == 0 means the server didn't supply a photo
    // but the record has been uploaded.
    taxon2 = Alloy.createModel("taxa");
    taxon2.set("sampleId", 666 );
    taxon2.set("abundance", "1-2");
    taxon2.set("taxonId", null );
    taxon2.set("serverCreatureId", 2); 
    taxon2.set("serverCreaturePhotoId", 0);
    taxon2.set("taxonPhotoPath", makeTestPhoto("test-photo-unknown-2.jpg"));
    taxon2.set("updatedAt", 0);
    taxon2.save();

    taxon3 = Alloy.createModel("taxa");
    taxon3.set("sampleId", 666 );
    taxon3.set("abundance", "1-2");
    taxon3.set("taxonId", null );
    taxon3.set("serverCreatureId", 3);
    taxon3.set("serverCreaturePhotoId", null);
    taxon3.set("taxonPhotoPath", makeTestPhoto("test-photo-unknown-3.jpg"));
    taxon3.set("updatedAt", 0);
    taxon3.save();

    let taxa = Alloy.createCollection("taxa");
    taxa.load(666);
    let pendingUploads = taxa.findPendingUploads();
    expect( pendingUploads.length, "pendingUploads.length" ).to.equal(1);
    expect( pendingUploads[0].get("serverCreatureId"),"serverCreatureId").to.equal(3);


  });

  it("should not include the temporary taxon in the taxons list", () => {
    var taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666 );
    taxon.set("taxonId", 1 );
    taxon.set("abundance", "1-2");
    taxon.set("updatedAt", 100000);
    taxon.save();

    taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666 );
    taxon.set("taxonId", 2 );
    taxon.set("abundance", "3-4");
    taxon.save();

    let taxa = Alloy.createCollection("taxa");
    taxa.load(666);
    expect( taxa.size() ).to.equal(1);
    expect( taxa.first().get("taxonId") ).to.equal(1);
  });

  it("should filter out saved taxons from loadTemporary", () => {
    var taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666 );
    taxon.set("taxonId", 2 );
    taxon.set("abundance", "1-2");
    taxon.set("updatedAt", 100000);
    taxon.save();

    taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666 );
    taxon.set("taxonId", 2 );
    taxon.set("abundance", "3-4");
    taxon.save();

    let taxa = Alloy.createCollection("taxa");
    taxa.loadTemporary(666,2);
    expect( taxa.size() ).to.equal(1);
    expect( taxa.first().get("updatedAt") ).not.to.exist;
  });


});




describe("Taxa model", function() {
  beforeEach( function() {
    clearDatabase();
  })

  it("should compare two taxons", function() {
    let taxon = Alloy.createModel("taxa", {
      sampleId: 666,
      abundance: "> 20",
      taxonId: 1,
      taxonPhotoPath: "path1",
      willDelete: null,
    });

    let taxon2 = Alloy.createModel("taxa", {
      sampleId: 123, // sampleId is ignored for equals()
      abundance: "> 20",
      taxonId: 1,
      taxonPhotoPath: "path1",
      willDelete: null
    });

    expect( taxon.equals(taxon2), "objects have same data fields" ).to.be.true;

    taxon.set("abundance", "1-2");
    expect( taxon.equals(taxon2), "objects have different abudance" ).to.be.false;

    taxon.set("abundance", "> 20");
    taxon.set("taxonId", 2);
    expect( taxon.equals(taxon2), "objects have different taxonId" ).to.be.false;

    taxon.set("taxonId", 1);
    taxon.set("taxonPhotoPath", "path2");
    expect( taxon.equals(taxon2), "objects have different taxonPhotoPath" ).to.be.false;



  });

  it('should persist a taxon', function() {
    // create taxa model
    var taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 666 );
    taxon.set("abundance", "> 20");
    taxon.set("taxonId", 1 );
    taxon.setPhoto(makeTestPhoto("test-photo.jpg"));
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
    taxon.setPhoto(makeTestPhoto("test-photo-666.jpg"));
    taxon.save();

    taxon = Alloy.createModel("taxa");
    taxon.set("sampleId", 667 );
    taxon.set("taxonId", 1 );
    taxon.set("abundance", "3-4");
    taxon.setPhoto(makeTestPhoto("test-photo-667.jpg"));
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

describe("Sample collection", function() {
  beforeEach( function() {
    clearDatabase();
  });
  it("should compare two sample records", function() {
      let sample1 = makeSampleData({ sampleId: 123});
      let sample2 = makeSampleData({ sampleId: 456});

      sample1.save();
      sample2.save();

      let taxon1 = Alloy.createModel("taxa");
      taxon1.set("sampleId", 123 );
      taxon1.set("abundance", "> 20");
      taxon1.set("taxonId", 1 );
      taxon1.set("updatedAt", 0);
      taxon1.save();

      let taxon2 = Alloy.createModel("taxa");
      taxon2.set("sampleId", 456 );
      taxon2.set("abundance", "> 20");
      taxon2.set("taxonId", 1 );
      taxon2.set("updatedAt", 0);
      taxon2.save();

      expect( sample1.equals(sample2), "compare two identical samples").to.be.true;

      let dataFields = [ 
            ["lat", 23 ], 
            ["lng", -56 ],
            ["accuracy", 6 ], 
            ["surveyType", Sample.SURVEY_ORDER],
					  ["waterbodyType", Sample.WATERBODY_WETLAND], 
            ["waterbodyName", "different test name"], 
            ["nearbyFeature", "different nearby feature"],
            ["boulder", 20 ],
					  ["gravel", 20 ],
            ["sandOrSilt", 20],
            ["leafPacks", 20],
            ["wood", 20], 
            ["aquaticPlants", 20],
            ["openWater", 20], 
            ["edgePlants", 20],
            ["serverSitePhotoId", 123],
            ["sitePhotoPath", "testpath"],
            ["complete", 1], 
            ["notes", "test notes" ] ];
      dataFields.forEach( ([ f, v ]) => {
        sample2.set(f,v);
        expect( sample1.equals(sample2), `differing ${f}`).to.be.false;
        sample2.set(f, sample1.get(f));
      });

      // make taxa collections differ
      let taxon3 = Alloy.createModel("taxa");
      taxon3.set("sampleId", 456 );
      taxon3.set("abundance", "> 20");
      taxon3.set("taxonId", 1 );
      taxon3.set("updatedAt", 0 );
      taxon3.save();
      expect( sample1.equals(sample2), `differing taxa collection`).to.be.false;
    

  })
});
describe("Sample model isBlank", function() {
  it('should return true if blank survey', function() {
    Alloy.Collections.instance("sample")
      .createNewSample();
    expect(Alloy.Models.sample.isBlank()).to.equal(true);
  });
  it('should return false if not blank survey', function() {
    Alloy.Models.sample = makeSampleData({dateCompleted: null});
    expect(Alloy.Models.sample.isBlank()).to.equal(false);
  });
})
describe("Sample model hasUnsavedChanges()", function() {
  beforeEach( clearDatabase );

  it('should return false if a new blank survey', async function() {
    Alloy.Collections.instance("sample")
      .createNewSample();
    let unsaved = await Alloy.Models.sample.hasUnsavedChanges();
    expect(unsaved).to.equal(false);
  });
  it('should return false if is already saved', async function() {
    Alloy.Models.sample = makeSampleData({ dateCompleted: moment().format() });
    let unsaved = await Alloy.Models.sample.hasUnsavedChanges();
    expect(unsaved).to.equal(false);
  });
  it('should return true if not blank new survey', async function() {
    Alloy.Models.sample = makeSampleData({dateCompleted: null});
    let unsaved = await Alloy.Models.sample.hasUnsavedChanges();
    expect(unsaved).to.equal(true);
  });
  it('should return true if edited survey is different to original', async function() {
    let original = makeSampleData({ serverSampleId: 55 });
    original.save();
    let temp = original.createTemporaryForEdit();
    temp.set("waterbodyName", "changed while editing");
    temp.save();
    expect(await temp.hasUnsavedChanges()).to.equal(true);
  });
  // GAP (unskip with the fix): createTemporaryForEdit round-trips through
  // toCerdiApiJson, which loses fidelity — lat/lng/accuracy numeric precision
  // ("-37.5622000" -> -37.5622) and complete (null -> 0). So equals() sees a
  // freshly-opened, unedited edit as different and hasUnsavedChanges() returns
  // true, giving a spurious discard/save prompt on immediate back-out.
  it.skip('should return false if edited survey is same as original', async function() {
    let original = makeSampleData({ serverSampleId: 55 });
    original.save();
    let temp = original.createTemporaryForEdit();
    expect(await temp.hasUnsavedChanges()).to.equal(false);
  });
});

// The in-progress edit must (a) survive an app restart, (b) never mutate the
// original until saved, and (c) never be treated as a submittable sample.
// loadCurrent is the boot-time resume seam (index-app.js).
describe("Sample model in-progress edit durability", function() {
  beforeEach( clearDatabase );

  it('resumes a local (un-uploaded) edit after restart via loadCurrent', async function() {
    let original = makeSampleData({ serverSampleId: null });
    original.save();
    let temp = original.createTemporaryForEdit();
    temp.set("waterbodyName", "mid-edit");
    temp.save();

    let resumed = Alloy.createModel("sample");
    await resumed.loadCurrent();
    expect( resumed.get("originalSampleId"), "resumes the temp edit copy" ).to.equal( original.get("sampleId") );
    expect( resumed.get("waterbodyName") ).to.equal("mid-edit");
  });

  // GAP (unskip with the fix): loadCurrent resumes `dateCompleted IS NULL AND
  // serverSampleId IS NULL`, but the temp copy of an uploaded sample carries the
  // original's serverSampleId — so the in-progress edit of an already-uploaded
  // sample is NOT resumed after an app restart (it's stranded in the sample
  // table). A separate drafts store keyed by "is a draft", not by serverSampleId,
  // fixes this cleanly.
  it.skip('resumes an uploaded-sample edit after restart via loadCurrent', async function() {
    let original = makeSampleData({ serverSampleId: 88 });
    original.save();
    let temp = original.createTemporaryForEdit();
    temp.set("waterbodyName", "mid-edit");
    temp.save();

    let resumed = Alloy.createModel("sample");
    await resumed.loadCurrent();
    expect( resumed.get("originalSampleId"), "resumes the temp edit copy" ).to.equal( original.get("sampleId") );
    expect( resumed.get("waterbodyName") ).to.equal("mid-edit");
  });

  it('leaves the original record untouched while an edit is in progress', function() {
    let original = makeSampleData({ serverSampleId: 88, waterbodyName: "original name" });
    original.save();
    let originalId = original.get("sampleId");
    let temp = original.createTemporaryForEdit();
    temp.set("waterbodyName", "mid-edit");
    temp.save();

    let reloaded = Alloy.createModel("sample");
    reloaded.loadById( originalId );
    expect( reloaded.get("waterbodyName"), "original unchanged until submit" ).to.equal("original name");
  });

  it('excludes the in-progress edit from the upload queue and history', function() {
    let original = makeSampleData({ serverSampleId: 88, serverUserId: 38 });
    original.save();
    let temp = original.createTemporaryForEdit();
    temp.set("waterbodyName", "mid-edit");
    temp.save();

    let queue = Alloy.createCollection("sample");
    queue.loadUploadQueue(38);
    expect( queue.pluck("originalSampleId").filter(Boolean), "no temp edit in the upload queue" ).to.be.empty;

    let history = Alloy.createCollection("sample");
    history.loadSampleHistory(38);
    expect( history.pluck("originalSampleId").filter(Boolean), "no temp edit in history" ).to.be.empty;
  });
});

describe("Sample model", function() { 
  var initialSampleId;

  function verifyTaxa(taxas,sampleId) {
    expect( taxas.length, "size of taxons collection" ).to.equal(7);
    
    [ 1, 2, 3, 4, 5 ].forEach( (taxonId) => { 
      let taxa = taxas.at(taxonId-1);
      expect(taxa.get("sampleId")).to.equal(sampleId);
      expect(taxa.get("abundance")).to.equal(["1-2","3-5","6-10","11-20","> 20"][taxonId-1]);
      expect(taxa.get("taxonId")).to.equal(taxonId);
      expect(taxa.get("taxonPhotoPath")).to.include(`taxon-${taxonId-1}.jpg`);
      expect(taxa.get("serverCreaturePhotoId")).to.equal(taxonId+100);
    });
    [ 6,7 ].forEach( (unknownTaxa) => { 
      let taxa = taxas.at(unknownTaxa-1);
      expect(taxa.get("sampleId")).to.equal(sampleId);
      expect(taxa.get("abundance"),`abdundance unknownTaxa = ${unknownTaxa}`).to.equal(["1-2","3-5"][unknownTaxa-6]);
      expect(taxa.get("taxonId"),"taxonId").to.be.null;
      expect(taxa.get("taxonPhotoPath")).to.include(`taxon-unknown-${unknownTaxa-1}.jpg`);
      expect(taxa.get("serverCreaturePhotoId")).to.equal(unknownTaxa+100);
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
      complete: 1,
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
          serverCreaturePhotoId: taxonId+100,
          updatedAt: 0 
          });
        taxon.save();
        Alloy.Collections.taxa.add(taxon);
    });

    // add some unknown taxons
    [ 6, 7 ].forEach( (unkownTaxa) => {
      let taxon = Alloy.createModel("taxa", { 
        sampleId:  Alloy.Models.sample.get("sampleId"),
        taxonId: null, 
        abundance: ["1-2","3-5"][unkownTaxa-6],
        taxonPhotoPath: makeTestPhoto(`taxon-unknown-${unkownTaxa-1}.jpg`),
        serverCreaturePhotoId: unkownTaxa+100,
        updatedAt: 0
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

  
  

  it('should NOT report pending uploads when sitePhotoPath is not set and serverSitePhotoId is not set', function(){
    let sample = Alloy.createModel("sample");
    sample.set("serverSitePhotoId",null);
    sample.set("serverSyncTime", moment().valueOf() );
    sample.set("updatedAt", moment().valueOf() - 100 );
    expect( sample.hasPendingUploads() ).to.be.false;
  });

  it('should report pending uploads when serverSitePhotoId is not set', function(){
    let sample = Alloy.createModel("sample");
    sample.set("sitePhotoPath","somesummyvalue");
    sample.set("serverSitePhotoId",null);
    sample.set("serverSyncTime", moment().valueOf() );
    sample.set("updatedAt", moment().valueOf() - 100 );
    expect( sample.hasPendingUploads() ).to.be.true;
  });

  it('should report pending uploads when serverSyncTime < updatedAt', function(){
    let sample = Alloy.createModel("sample");
    sample.set("serverSitePhotoId",1);
    sample.set("serverSyncTime", moment().valueOf() );
    sample.set("updatedAt", moment().valueOf() + 100 );
    expect( sample.hasPendingUploads() ).to.be.true;
    sample.set("serverSyncTime", moment().valueOf() );
    sample.set("updatedAt", moment().valueOf() - 100 );
    expect( sample.hasPendingUploads() ).to.be.false;
  });

  it('should report pending uploads when taxons have pending upload', function(){
    let sample = Alloy.createModel("sample");
    let taxaMock = {};
    simple.mock(taxaMock,"findPendingUploads").returnWith( [{},{}] );
    simple.mock(sample,"loadTaxa").returnWith( taxaMock );
    sample.set("serverSitePhotoId",1);
    sample.set("serverSyncTime", moment().valueOf() );
    sample.set("updatedAt", moment().valueOf() - 100 );
    expect( sample.hasPendingUploads() ).to.be.true;
  });
  
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


  // Occasionally, probably due to a hard to replicate race condition, loadByServerId()
  // was failing to load the record, which results in a new sample record being populated,
  // which causes additional duplicates. We don't want duplicates so we test that
  // when there is more than one record meeting the criteria that at least one of them
  // is loaded. 
  it('should load by server id even if there is a duplicate', async function() {
    clearDatabase();
    let sample = makeSampleData( { 
        sitePhotoPath: makeTestPhoto("site.jpg"),
        dateCompleted:  moment("2020-01-01").valueOf(),
        serverSampleId: 666,
        serverSyncTime: moment("2020-01-01").valueOf()
    });
    sample.save(); 


    // this SHOULD (but doesn't) create a duplicate????????
    let sample2 = makeSampleData( { 
        sitePhotoPath: makeTestPhoto("site.jpg"),
        dateCompleted:  moment("2020-01-01").valueOf(),
        serverSampleId: 666,
        serverSyncTime: moment("2020-01-01").valueOf()
    });
    sample2.save();

    var model = Alloy.createModel("sample");
    await model.loadByServerId(666);

    expect( model.get("serverSampleId") ).to.equal(666);
     

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
      expect( taxa.length ).to.equal(7);
      [ 1, 2, 3, 4, 5 ].forEach( (taxonId) => {
        let taxon = taxa.at(taxonId-1);
        expect( taxon.get("taxonId") ).to.equal(taxonId);
      }); 
      expect(taxa.at(5).get("taxonId")).to.be.null;
      expect(taxa.at(6).get("taxonId")).to.be.null;
    });
  });
  context('should destroy a sample correctly', function() {
    let sample;
    this.beforeEach(function() {
      sample = Alloy.createModel("sample");
      sample.loadById(initialSampleId);
      sample.destroy();
    });
    it('should clear the data from memory on destroy', function() {
      expect( sample.get("sampleId")).to.be.undefined;
    });
    it('should remove data from database', function() {
      sample = Alloy.createModel("sample");
      sample.loadById(initialSampleId);
      expect( sample.get("sampleId")).to.be.undefined;
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
    beforeEach(async function() {
      await Alloy.Models.sample.saveCurrentSample();
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
      taxonPhotoPath: makeTestPhoto(`taxon-98.jpg`),
      updatedAt: 0
      }).save();

    Alloy.createModel("taxa",{ 
      sampleId:  tempSample.get("sampleId"),
      taxonId: 66, 
      abundance: "1-2",
      taxonPhotoPath: makeTestPhoto(`taxon-65.jpg`),
      updatedAt: 0
      }).save();

    tempSample.save();

    expect(rowCount(),"there should be 2 rows, the orginal, and the copy").to.equal(2);

    // check old row still exists
    let oldSample = Alloy.createModel("sample");
    oldSample.loadByServerId(99);
    expect(oldSample.get("waterbodyName")).to.equal("Test Waterbody");
    verifyTaxa(oldSample.loadTaxa(), oldSample.get("sampleId"));
   
    await tempSample.saveCurrentSample();

    // should be updated
    var sample = Alloy.createModel("sample");
    sample.loadByServerId(99);
    expect( sample.get("waterbodyName")).to.equal("edited"); 

    // verify updated mixture of taxons
    let sampleId = sample.get('sampleId');
    let taxas = sample.loadTaxa();
    expect( taxas.length ).to.equal(8);
    let index = 0;
    [ 2, 3, 4, 5, null, null, 99, 66 ].forEach( (taxonId) => { 
      let taxa = taxas.at(index);
      expect(taxa.get("sampleId"),"sampleId").to.equal(sampleId);
      expect(taxa.get("abundance"),`abundance taxonId=${taxonId}`).to.equal(["3-5","6-10","11-20","> 20","1-2","3-5","> 20","1-2"][index]);
      expect(taxa.get("taxonId"),"taxonId").to.equal(taxonId);
      if ( taxonId ) {
        expect(taxa.get("taxonPhotoPath"),"taxonPhotoPath").to.include(`taxon-${taxonId-1}.jpg`);
      } else {
        expect(taxa.get("taxonPhotoPath"),"taxonPhotoPath").to.include(`unknown`);
      }
      if ( taxonId !== 66 && taxonId !== 99 && taxonId != null ) {
        expect(taxa.get("serverCreaturePhotoId"),"serverCreaturePhotoId").to.equal(taxonId+100);
      }
      index++;
    });

    expect(rowCount(),"the old copy should be removed").to.equal(1);

  });

  context("saveCurrentSample survey date (WB-158)", function() {
    beforeEach(function() {
      clearDatabase();
      Alloy.Models.sample = makeSampleData({ dateCompleted: null });
    });

    it("defaults dateCompleted to now when no survey-date override is set", async function() {
      await Alloy.Models.sample.saveCurrentSample();
      expect(Alloy.Models.sample.get("dateCompleted")).to.be.a.dateString();
    });

    it("uses overrideDateCompleted as dateCompleted when the user chose a survey date", async function() {
      let chosen = moment("2020-01-02T03:04:05").format();
      Alloy.Models.sample.set("overrideDateCompleted", chosen);
      await Alloy.Models.sample.saveCurrentSample();
      expect(Alloy.Models.sample.get("dateCompleted")).to.equal(chosen);
    });
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

describe("WB-166: editing a dated survey keeps its survey date", function() {
  beforeEach(clearDatabase);

  function makeDatedSurvey(originalDate) {
    let s = makeSampleData({
      serverSampleId: 777,
      dateCompleted: originalDate,
      serverSyncTime: moment().valueOf()
    });
    s.save();
    return s;
  }

  it("opens the temporary edit on the original survey date, not today", function() {
    let originalDate = moment("2020-03-15T09:00:00").format();
    let temp = makeDatedSurvey(originalDate).createTemporaryForEdit();
    expect(temp.get("overrideDateCompleted")).to.equal(originalDate);
  });

  it("preserves the original date when an edited survey is resubmitted", async function() {
    let originalDate = moment("2020-03-15T09:00:00").format();
    let temp = makeDatedSurvey(originalDate).createTemporaryForEdit();
    await temp.saveCurrentSample();
    expect(temp.get("dateCompleted")).to.equal(originalDate);
  });

  it("shows the overridden date on the summary while editing, not today", function() {
    let originalDate = moment("2020-03-15T09:00:00").format();
    let temp = makeDatedSurvey(originalDate).createTemporaryForEdit();
    expect(temp.transform().dateCompleted)
      .to.equal(moment(originalDate).format("DD/MMM/YYYY h:mm:ss a"));
  });
});

describe("WB-143: complete=false survives the edit roundtrip", function() {
  beforeEach(clearDatabase);

  function makeUncheckedSample() {
    let s = makeSampleData({
      serverSampleId: 1862,
      complete: 0,
      dateCompleted: moment().format(),
      serverSyncTime: moment().valueOf()
    });
    s.save();
    return s;
  }

  it("(A) createTemporaryForEdit preserves complete=false in the in-memory dup", function() {
    let dup = makeUncheckedSample().createTemporaryForEdit();
    expect(dup.get("complete"),
      `dup.complete after createTemporaryForEdit: ${dup.get("complete")} (typeof ${typeof dup.get("complete")})`)
      .to.be.falsy;
  });

  it("(B) complete=false survives dup.save() + reload via loadById", function() {
    let dup = makeUncheckedSample().createTemporaryForEdit();
    let reloaded = Alloy.createModel("sample");
    reloaded.loadById(dup.get("sampleId"));
    expect(reloaded.get("complete"),
      `reloaded.complete: ${reloaded.get("complete")} (typeof ${typeof reloaded.get("complete")})`)
      .to.be.falsy;
  });

  it("(C) toCerdiApiJson after the roundtrip still serialises complete=false", function() {
    let dup = makeUncheckedSample().createTemporaryForEdit();
    let reloaded = Alloy.createModel("sample");
    reloaded.loadById(dup.get("sampleId"));
    let json = reloaded.toCerdiApiJson();
    expect(json.complete,
      `serialised complete: ${json.complete} (typeof ${typeof json.complete})`)
      .to.equal(false);
  });
});

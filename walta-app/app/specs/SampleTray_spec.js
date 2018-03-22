require('specs/lib/ti-mocha');
var mocx = require("specs/lib/mocx");
var speedBugResource = "specs/resources/simpleKey1/media/speedbug/";
var speedBugIndexMock = {
  getSpeedbugFromTaxonId: function( id ) {
    switch(id) {
      case "WB1":
        return { imgUrl: speedBugResource + "aeshnidae_telephleb_b.png" };

      case "WB2":
        return { imgUrl: speedBugResource + "amphipoda_b.png" };

      case "WB3":
        return { imgUrl: speedBugResource + "anisops_b.png" };

      case "WB4":
        return { imgUrl: speedBugResource + "anostraca_b.png" };

      case "WB5":
        return { imgUrl: speedBugResource + "atalophlebia_b.png" };

    }
  }
}

mocx.createCollection("taxa", [
  {
    taxonId: "WB1",
    multiplicity: 2
  },

  {
    taxonId: "WB2",
    multiplicity: 3
  },

  {
    taxonId: "WB3",
    multiplicity: 2
  },

  {
    taxonId: "WB4",
    multiplicity: 1
  },

  {
    taxonId: "WB5",
    multiplicity: 1
  },

  {
    taxonId: "WB4",
    multiplicity: 3
  },

  {
    taxonId: "WB1",
    multiplicity: 1
  },

  {
    taxonId: "WB3",
    multiplicity: 1
  },

  {
    taxonId: "WB2",
    multiplicity: 1
  },

  {
    taxonId: "WB2",
    multiplicity: 2
  },

  {
    taxonId: "WB5",
    multiplicity: 6
  }
]);

var TestUtils = require('specs/util/TestUtils');
var Alloy = require('alloy');
var SampleTray, SampleTrayWin;

describe( 'SampleTray', function() {
  before(function(done) {
      SampleTray = Alloy.createController("SampleTray", { speedbugIndex: speedBugIndexMock });
      SampleTrayWin = TestUtils.wrapViewInWindow( SampleTray.getView() );
      SampleTrayWin.addEventListener("open" , function open() {
        SampleTrayWin.removeEventListener("open", open);
        done();
      } );
      SampleTrayWin.open();
  });

  after(function(done){
    SampleTray.cleanup();
    SampleTrayWin.addEventListener('close' , function close() {
      Ti.API.log("entering close");
      SampleTrayWin.removeEventListener("close", close);

      SampleTrayWin = null;
      SampleTray.off();
      SampleTray.destroy();
      SampleTray = null;
      done()
    } );
    SampleTrayWin.close();
  });

  it('should display the correct sample entry for each hole', function(done) {

  });

  it('when scrolled to the right it should update the screen properly', function(done) {

  });

  it('when scrolled to the left it should update the screen properly', function(done) {

  });

  it('it should have a length with 6 blank holes at the end', function(done) {

  });

  it('when a taxon is removed it should update', function(done) {

  });

  it('when a taxon is added it should update', function(done) {

  });

  it('when a taxon multiplicity is changed it should update', function(done) {

  });
});

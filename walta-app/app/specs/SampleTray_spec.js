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
  },

  {
    taxonId: "WB4",
    multiplicity: 2
  }
]);

var TestUtils = require('specs/util/TestUtils');
var Alloy = require('alloy');
describe( 'SampleTray', function() {
  it('should open', function(done) {
      var SampleTray = Alloy.createController("SampleTray", { speedbugIndex: speedBugIndexMock });
      var win = TestUtils.wrapViewInWindow( SampleTray.getView() );
      win.addEventListener('open' , function() { done() } );
      win.open();
  })
});

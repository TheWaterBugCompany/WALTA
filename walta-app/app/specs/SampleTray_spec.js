require('specs/lib/ti-mocha');

var { expect } = require('specs/lib/chai');
var Alloy = require('alloy');
var { wrapViewInWindow, testOnEvent, isManualTests } = require('specs/util/TestUtils');
var MockSpeedbug = require('specs/mocks/MockSpeedbug');
var mocx = require("specs/lib/mocx");

describe( 'SampleTray', function() {

  var SampleTray, SampleTrayWin;

  function setupSampleTray() {
    SampleTray = Alloy.createController("SampleTray", { speedbugIndex: MockSpeedbug.speedBugIndexMock });
    SampleTrayWin = wrapViewInWindow( SampleTray.getView() );
  }

  function openSampleTray() {
    SampleTrayWin.addEventListener("open" , function open() {
      SampleTrayWin.removeEventListener("open", open);
    } );
    SampleTrayWin.open();
  }

  function cleanupSampleTray(done) {
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
  }

  function assertSample( taxon, image, multiplicity ) {
    var unwraped = taxon.getChildren()[0];
    var [ icon, label ] = unwraped.getChildren();
    expect( icon.image, `Expected the the taxon to be ${image}` ).to.include( image );
    if ( multiplicity > 1 ) {
      expect( label.text, `Expected the multiplicity label to be ${multiplicity}` ).to.equal( multiplicity );
    } else {
      expect( label ).to.be.an("undefined");
    }
  }

  function assertSampleBlank( taxon ) {
    expect( taxon.getChildren() ).to.be.empty;
  }

  function assertTaxaBackground( tile, image ) {
    expect( tile.getChildren()[0].image ).to.include(image);
  }

  function getTaxaIcons( tile ) {
    return tile.getChildren()[1].getChildren();
  }

  context( 'Rendering', function() {

    beforeEach(function() {
      mocx.createCollection("taxa", [
        { taxonId: "WB1", multiplicity: 2 },
        { taxonId: "WB2", multiplicity: 3 },

        { taxonId: "WB3", multiplicity: 2 },
        { taxonId: "WB4", multiplicity: 1 },
        { taxonId: "WB5", multiplicity: 1 },
        { taxonId: "WB1", multiplicity: 3 },

        { taxonId: "WB1", multiplicity: 1 },
        { taxonId: "WB3", multiplicity: 1 },
        { taxonId: "WB2", multiplicity: 1 },
        { taxonId: "WB2", multiplicity: 2 },

        { taxonId: "WB5", multiplicity: 6 }
      ]);
      setupSampleTray();
    });

    afterEach(function(done){
      if ( ! isManualTests() ) {
        cleanupSampleTray(done);
      } else {
        done();
      }
    });

    it('should display the correct sample entry for each tray position displayed', function() {
        return testOnEvent( SampleTray, "trayupdated", function() {
          var tiles = SampleTray.getView().getChildren();
          expect( tiles ).to.have.lengthOf(5);

          // assert end cap
          assertTaxaBackground( tiles[0], "images/endcap_320.png" );
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertSample( sampleTaxa[0], "/aeshnidae_telephleb_b.png", 2 );
          assertSample( sampleTaxa[1], "/amphipoda_b.png", 3 );

          // assert first tile
          assertTaxaBackground( tiles[1], "images/tiling_interior_320.png" );
          sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertSample( sampleTaxa[0], "/anisops_b.png", 2 );
          assertSample( sampleTaxa[1], "/atalophlebia_b.png", 1 );
          assertSample( sampleTaxa[2], "/anostraca_b.png", 1 );
          assertSample( sampleTaxa[3], "/aeshnidae_telephleb_b.png", 3 );

          // assert second tile
          assertTaxaBackground( tiles[2], "images/tiling_interior_320.png" );
          sampleTaxa = getTaxaIcons( tiles[2] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertSample( sampleTaxa[0], "/aeshnidae_telephleb_b.png", 1 );
          assertSample( sampleTaxa[1], "/amphipoda_b.png", 1 );
          assertSample( sampleTaxa[2], "/anisops_b.png", 1 );
          assertSample( sampleTaxa[3], "/amphipoda_b.png", 2 );

          // assert third tile
          assertTaxaBackground( tiles[3], "images/tiling_interior_320.png" );
          sampleTaxa = getTaxaIcons( tiles[3] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertSample( sampleTaxa[0], "/atalophlebia_b.png", 6 );
          assertSampleBlank( sampleTaxa[1] );
          assertSampleBlank( sampleTaxa[2] );
          assertSampleBlank( sampleTaxa[3] );

          // assert fourth tile
          assertTaxaBackground( tiles[4], "images/tiling_interior_320.png" );
          sampleTaxa = getTaxaIcons( tiles[4] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertSampleBlank( sampleTaxa[0] );
          assertSampleBlank( sampleTaxa[1] );
          assertSampleBlank( sampleTaxa[2] );
          assertSampleBlank( sampleTaxa[3] );
        }, openSampleTray );
      });
  });

  context('scrolling a very long tray', function() {
    it('when scrolled to the right it should update the screen properly');
    it('when scrolled to the left it should update the screen properly');
    it('it should have a length with 6 blank holes at the end');
  });

  context('adding and removing taxa', function() {
    it('when a taxon is removed it should update');
    it('when a taxon is added it should update');
    it('when a taxon multiplicity is changed it should update');
  });
});

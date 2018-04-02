require('specs/lib/ti-mocha');

var { expect } = require('specs/lib/chai');
var Alloy = require('alloy');
var { wrapViewInWindow, waitForEvent, isManualTests, setManualTests, waitForTick, waitForBrowserEvent } = require('specs/util/TestUtils');
var MockSpeedbug = require('specs/mocks/MockSpeedbug');
var mocx = require("specs/lib/mocx");

setManualTests(false);

describe( 'SampleTray', function() {

  var SampleTray, SampleTrayWin;

  function setupSampleTray() {
    SampleTray = Alloy.createController("SampleTray", { speedbugIndex: MockSpeedbug.speedBugIndexMock });
    SampleTrayWin = wrapViewInWindow( SampleTray.getView() );
  }

  function openSampleTray() {
    return Promise.all(
      [ Promise.resolve().then( () => {
           SampleTrayWin.addEventListener( "close", function close() {
             SampleTrayWin.removeEventListener( "close", close );
             SampleTray.cleanup();
             SampleTray.off();
             SampleTray.destroy();
           });
           SampleTrayWin.open()
        }),
        Promise.resolve().then( waitForEvent( SampleTray, "trayupdated") ) ]);
  }

  function cleanupSampleTray() {
    if ( ! isManualTests() ) {
      return Promise.all(
        [ Promise.resolve( SampleTrayWin.close ),
          waitForBrowserEvent( SampleTrayWin.close, "close" ) ]
      );
    } else {
      return Promise.resolve();
    }
  }

  function findLeftMost(arr) {
    return _.min( arr, function(c) { return c.getRect().x } );
  }

  function findRightMost(arr) {
    return _.max( arr, function(c) { return c.getRect().x } );
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

  context( 'rendering', function() {

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

    afterEach(cleanupSampleTray);

    it('should display the correct sample entry for each tray position displayed', function() {
        return Promise.resolve()
          .then( openSampleTray )
          .then( function() {
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
            });
      });
  });

  context('adding the plus button', function() {
      it('should render an add button with a blank tray', function (){
        return Promise.resolve()
          .then( function() {
            mocx.createCollection("taxa", []);
            setupSampleTray();
          })
          .then( openSampleTray )
          .then( function() {

          } )
          .then( cleanupSampleTray )
      })
  });


  context.only('scrolling a long tray', function() {
    beforeEach(function() {
      // a collection that is long enough to need to scroll
      // and hide tiles and reveal them correctly
      mocx.createCollection("taxa", [
        { taxonId: "WB1", multiplicity: 2 }, // 0
        { taxonId: "WB2", multiplicity: 3 },

        { taxonId: "WB3", multiplicity: 2 }, // 1
        { taxonId: "WB4", multiplicity: 1 },
        { taxonId: "WB5", multiplicity: 1 },
        { taxonId: "WB1", multiplicity: 3 },

        { taxonId: "WB2", multiplicity: 1 }, // 2
        { taxonId: "WB3", multiplicity: 1 },
        { taxonId: "WB4", multiplicity: 1 },
        { taxonId: "WB5", multiplicity: 2 },

        { taxonId: "WB1", multiplicity: 2 }, // 3
        { taxonId: "WB2", multiplicity: 1 },
        { taxonId: "WB3", multiplicity: 2 },
        { taxonId: "WB4", multiplicity: 3 },

        { taxonId: "WB5", multiplicity: 2 }, // 4
        { taxonId: "WB4", multiplicity: 1 },
        { taxonId: "WB3", multiplicity: 2 },
        { taxonId: "WB2", multiplicity: 1 },

        { taxonId: "WB1", multiplicity: 2 },
        { taxonId: "WB2", multiplicity: 1 },
        { taxonId: "WB3", multiplicity: 2 },
        { taxonId: "WB4", multiplicity: 1 },

        { taxonId: "WB1", multiplicity: 2 },
        { taxonId: "WB2", multiplicity: 1 },
        { taxonId: "WB3", multiplicity: 2 },
        { taxonId: "WB4", multiplicity: 1 }
      ]);
      setupSampleTray();
    });

    afterEach(cleanupSampleTray);

    /* These tests just check that the leftmost and right most tiles contain
       the data we are expecting after a scroll */

    /* Note: Since order is not well defined in the tile array - depending on
      the implementation - we need to look up expect tile positions by
      there coordinates in the view. */

    it('when scrolled to the right it should update the screen properly', function() {
      return Promise.resolve()
          .then( openSampleTray )
          .then( waitForTick( 10 ) )
          .then( function() {
            SampleTray.getView().scrollTo( 209*4, 0 );
            })
          .then( waitForEvent( SampleTray, "trayupdated") )
          .then( waitForTick( 10 ) )
          .then( function() {
            var tiles = SampleTray.getView().getChildren();
            expect( tiles ).to.have.lengthOf(6);

            tiles.shift(); // discard end cap since that is always static

            // assert first tile
            var tile = findLeftMost( tiles  );
            assertTaxaBackground( tile, "images/tiling_interior_320.png" );
            var sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertSample( sampleTaxa[0], "/amphipoda_b.png", 1 );
            assertSample( sampleTaxa[1], "/anostraca_b.png", 1 );
            assertSample( sampleTaxa[2], "/anisops_b.png", 1 );
            assertSample( sampleTaxa[3], "/atalophlebia_b.png", 2 );

            // assert last tile
            var tile = findRightMost( tiles  );
            assertTaxaBackground( tile, "images/tiling_interior_320.png" );
            sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertSample( sampleTaxa[0], "/aeshnidae_telephleb_b.png", 2 );
            assertSample( sampleTaxa[1], "/anisops_b.png", 2 );
            assertSample( sampleTaxa[2], "/amphipoda_b.png", 1 );
            assertSample( sampleTaxa[3], "/anostraca_b.png", 1 );
          });

    });

    it('when scrolled to the left it should update the screen properly', function() {
      return Promise.resolve()
          .then( openSampleTray )
          .then( waitForTick( 10 ) )
          .then( function() {
            SampleTray.getView().scrollTo( 209*4, 0 );
            })
          .then( waitForEvent( SampleTray, "trayupdated") )
          .then( waitForTick( 10 ) )
          .then( function() {
            SampleTray.getView().scrollTo( 0, 0 );
          })
          .then( waitForEvent( SampleTray, "trayupdated") )
          .then( waitForTick( 10 ) )
          .then( function() {
            var tiles = SampleTray.getView().getChildren();
            expect( tiles ).to.have.lengthOf(5);

            tiles.shift(); // discard end cap since that is always static

            // assert left most tile
            var tile = findLeftMost( tiles  );
            assertTaxaBackground( tile, "images/tiling_interior_320.png" );
            var sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertSample( sampleTaxa[0], "/anisops_b.png", 2 );
            assertSample( sampleTaxa[1], "/atalophlebia_b.png", 1 );
            assertSample( sampleTaxa[2], "/anostraca_b.png", 1 );
            assertSample( sampleTaxa[3], "/aeshnidae_telephleb_b.png", 3 );

            // assert rightmost tile
            var tile = findRightMost( tiles );
            assertTaxaBackground( tile, "images/tiling_interior_320.png" );
            sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertSample( sampleTaxa[0], "/atalophlebia_b.png", 2 );
            assertSample( sampleTaxa[1], "/anisops_b.png", 2 );
            assertSample( sampleTaxa[2], "/anostraca_b.png", 1 );
            assertSample( sampleTaxa[3], "/amphipoda_b.png", 1 );
          });
    });
  });

  context('adding and removing taxa', function() {
    it('should fire the Topics.IDENTIFY when the plus icon is clicked')
    it('should update when a taxon is removed');
    it('should update when a taxon is added');
    it('should update when a taxon multiplicity is changed');
  });
});

require('specs/lib/ti-mocha');

var { expect } = require('specs/lib/chai');
var { wrapViewInWindow, waitForEvent, isManualTests, setManualTests, waitForTick, waitForBrowserEvent } = require('specs/util/TestUtils');
var MockSpeedbug = require('specs/mocks/MockSpeedbug');
var mocx = require("specs/lib/mocx");
var Topics = require('ui/Topics');

describe( 'SampleTray', function() {
  this.timeout(10000);
  var SampleTray, SampleTrayWin;

  function setupSampleTray() {
    SampleTray = Alloy.createController("SampleTray", { speedbugIndex: MockSpeedbug.speedBugIndexMock });
    SampleTrayWin = SampleTray.getSampleTrayWin();
  }

  function updateSampleTrayOnce(resolve) {
    SampleTray.on("trayupdated", function trayUpdate() {
      SampleTray.off("trayupdated", trayUpdate);
      setTimeout( resolve, 10 );
    });
  }

  function openSampleTray() {
    return new Promise( function( resolve ) {
          SampleTrayWin.addEventListener("open", function openWin() {
            SampleTrayWin.removeEventListener("open", openWin );
            updateSampleTrayOnce(resolve);
          })
          SampleTrayWin.open();
        });
  }

  function scrollSampleTray( x ) {
    return function() {
      return new Promise( function( resolve ) {
          updateSampleTrayOnce(resolve);
          SampleTray.getView().scrollTo( x, 0 );
        });
    }
  }

  function cleanupSampleTray() {
    if ( ! isManualTests() ) {
      if ( typeof( SampleTrayWin ) !== "undefined" ) {
        return new Promise( function( resolve ) {
          SampleTrayWin.addEventListener( "close", function e() {
            SampleTrayWin.removeEventListener( "close", e );
            resolve();
          } );
          SampleTrayWin.close();
        });
      }
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
    var unwrapped = taxon.getChildren()[0];
    var [ icon, label ] = unwrapped.getChildren();
    expect( icon.image, `Expected the the taxon to be ${image}` ).to.include( image );
    expect( label.text, `Expected the multiplicity label to be ${multiplicity}` ).to.equal( multiplicity );
  }

  function clickPlus( square ) {
    var unwrapped = square.getChildren()[0];
    unwrapped.fireEvent('click');
  }

  function assertPlus( square ) {
    var unwraped = square.getChildren()[0];
    expect( unwraped.backgroundImage ).to.include('images/plus-icon.png');
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
    afterEach(cleanupSampleTray);
    it('should render an add button with a blank tray', function (){
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", []);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          expect( tiles ).to.have.lengthOf(4); // check that extra blank tiles are added
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertPlus( sampleTaxa[0] );
        } );
    });

    it('should render an add button with a single taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            { taxonId: "WB1", multiplicity: 1 }
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          expect( tiles ).to.have.lengthOf(4); // check that extra blank tiles are added
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertPlus( sampleTaxa[1] );
        } );
    });

    it('should render an add button with two taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            { taxonId: "WB1", multiplicity: 2 },
            { taxonId: "WB3", multiplicity: 1 }
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertPlus( sampleTaxa[0] );
        } );
    });

    it('should render an add button with three taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            { taxonId: "WB1", multiplicity: 2 },
            { taxonId: "WB3", multiplicity: 1 },
            { taxonId: "WB5", multiplicity: 1 }
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertSampleBlank( sampleTaxa[1] );
          assertPlus( sampleTaxa[2] );
        } );
    });

    it('should render an add button with four taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            { taxonId: "WB1", multiplicity: 2 },
            { taxonId: "WB3", multiplicity: 1 },
            { taxonId: "WB5", multiplicity: 1 },
            { taxonId: "WB2", multiplicity: 1 }
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertPlus( sampleTaxa[1] );
        } );
    });

    it('should render an add button with five taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            { taxonId: "WB1", multiplicity: 2 },
            { taxonId: "WB3", multiplicity: 1 },
            { taxonId: "WB5", multiplicity: 2 },
            { taxonId: "WB2", multiplicity: 1 },
            { taxonId: "WB4", multiplicity: 1 }
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertPlus( sampleTaxa[3] );
        } );
    });

    it('should display the correct sample entry for each tray position displayed', function() {
        return Promise.resolve()
          .then( function() {
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
          })
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
              assertPlus( sampleTaxa[2] );
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

  context('scrolling a long tray', function() {
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
          .then( scrollSampleTray( 209*4 ) )
          .then( function() {
            var tiles = SampleTray.getView().getChildren();
            expect( tiles ).to.have.lengthOf(7);

            tiles.shift(); // discard end cap since that is always static

            // assert first tile
            var tile = findLeftMost( tiles  );
            assertTaxaBackground( tile, "images/tiling_interior_320.png" );
            var sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertSample( sampleTaxa[0], "/anisops_b.png", 2 );
            assertSample( sampleTaxa[1], "/atalophlebia_b.png", 1 );
            assertSample( sampleTaxa[2], "/anostraca_b.png", 1 );
            assertSample( sampleTaxa[3], "/aeshnidae_telephleb_b.png", 3 );

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
          .then( scrollSampleTray(209*4) )
          .then( scrollSampleTray(0) )
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

    afterEach(cleanupSampleTray);
    it.skip('should fire the Topics.IDENTIFY when the plus icon is clicked', function() {
      // now opens MethodSelect open
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", []);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( resolve => {
            Topics.subscribe( Topics.IDENTIFY, resolve );
            clickPlus( sampleTaxa[0] );
          });
        });
    });

    it('should update when a taxon is added in first two holes', function() {
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", []);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].add( { taxonId: "WB1", multiplicity: 2 } );
          });
        })
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertSample( sampleTaxa[0], "/aeshnidae_telephleb_b.png", 2 );
          assertPlus( sampleTaxa[1] );
        });
    });

    it('should update when a taxon is added after first two holes', function() {
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            { taxonId: "WB1", multiplicity: 2 },
            { taxonId: "WB3", multiplicity: 1 },
            { taxonId: "WB5", multiplicity: 1 }
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].add( { taxonId: "WB4", multiplicity: 2 } );
          });
        })
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertSample( sampleTaxa[2], "/anostraca_b.png", 2 );
          assertPlus( sampleTaxa[1] );
        });
    });

    it('should update when a taxon is removed from the first two holes', function() {
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            { taxonId: "WB1", multiplicity: 2 },
            { taxonId: "WB5", multiplicity: 1 }
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].remove( Alloy.Collections["taxa"].at(1) );
          });
        })
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertPlus( sampleTaxa[1] );
        });
    });

    it('should update when a taxon is removed after first two holes', function() {
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            { taxonId: "WB1", multiplicity: 2 },
            { taxonId: "WB3", multiplicity: 1 },
            { taxonId: "WB5", multiplicity: 1 },
            { taxonId: "WB2", multiplicity: 1 }
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].remove( Alloy.Collections["taxa"].at(3) );
          });
        })
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertPlus( sampleTaxa[2] );
        });
    });

    it('should update when a taxon multiplicity is changed', function() {
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            { taxonId: "WB1", multiplicity: 1 },
            { taxonId: "WB5", multiplicity: 1 }
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].at(1).set('multiplicity', 2);
          });
        })
        .then( function() {
          var tiles = SampleTray.getView().getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertSample( sampleTaxa[1], "/atalophlebia_b.png", 2 );
        });
    });
  });
});

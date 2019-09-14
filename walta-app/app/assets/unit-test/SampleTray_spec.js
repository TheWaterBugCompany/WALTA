require('unit-test/lib/ti-mocha');
var PlatformSpecific = require('ui/PlatformSpecific');
var { expect } = require('unit-test/lib/chai');
var { closeWindow, checkTestResult, actionFiresTopicTest } = require('unit-test/util/TestUtils');

var Topics = require('ui/Topics');
var mocx = require("unit-test/lib/mocx");

var { speedBugIndexMock } = require('unit-test/mocks/MockSpeedbug');
var { keyMock } = require('unit-test/mocks/MockKey');
keyMock.addSpeedbugIndex( speedBugIndexMock );


describe( 'SampleTray controller', function() {
  this.timeout(10000);
  var SampleTray, SampleTrayWin;

  function setupSampleTray() {
    Alloy.Models.instance("sample");
    SampleTray = Alloy.createController("SampleTray", { key: keyMock });
    SampleTrayWin = SampleTray.getView();
  }

  function updateSampleTrayOnce(resolve) {
    SampleTray.on("trayupdated", function trayUpdate() {
        SampleTray.off("trayupdated", trayUpdate);
        setTimeout( resolve, 10 );
    });
  }

  function openSampleTray() {
    return new Promise( function( resolve, reject ) {
          SampleTrayWin.addEventListener("open", function openWin() {
            SampleTrayWin.removeEventListener("open", openWin );
            updateSampleTrayOnce(function() {
              try {
                expect( SampleTray.content.size.height + SampleTray.getAnchorBar().getView().size.height )
                  .to.equal( SampleTray.getView().size.height );
                  resolve();
              } catch( err ) {
                  reject(err);
              }
            });
          })
          SampleTray.open();
        });
  }

  function scrollSampleTray( x ) {
    return function() {
      return new Promise( function( resolve ) {
          function isAtScrollX(e) {
            if ( Math.abs(e.x - PlatformSpecific.convertDipToSystem(x)) < 1.0 ) {
              SampleTray.content.removeEventListener("scroll",isAtScrollX);
              setTimeout( resolve, 5 );
            }
          } 
          SampleTray.content.addEventListener("scroll", isAtScrollX );
          SampleTray.content.scrollTo( PlatformSpecific.convertDipToSystem(x), 0, { animate: true } );
        });
    }
  }

  function cleanupSampleTray( done ) {
    closeWindow( SampleTrayWin, done );
  }

  function findLeftMost(arr,i=0) {
    var sorted = arr.slice(0).sort( (a,b) => a.getRect().x - b.getRect().x );
    return sorted[i];
  }

  function findRightMost(arr,i=0) {
    var sorted = arr.slice(0).sort( (a,b) => b.getRect().x - a.getRect().x );
    return sorted[i];
  }

  function assertSample( taxon, image, abundance ) {
    var unwrapped = taxon.getChildren()[0].getChildren()[0];
    var [ icon, label ] = unwrapped.getChildren();
    expect( icon.image, `Expected the the taxon to be ${image}` ).to.include( image );
    expect( label.text, `Expected the abundance label to be ${abundance}` ).to.equal( abundance );
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
    expect( taxon.getChildren()  ).to.be.empty;
  }

  function assertTaxaBackground( tile, image ) {
    expect( tile.getChildren()[0].image ).to.include(image);
  }

  function getTaxaIcons( tile ) {
    return tile.getChildren()[1].getChildren();
  }

  context( 'event handling', function(){

    beforeEach( function() {
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", []);
          setupSampleTray();
        })
        .then( openSampleTray );
    });

    afterEach(cleanupSampleTray);

    it('should fire the COMPLETE topic', function(done) {
      actionFiresTopicTest( SampleTray.completeBtn, 'click', Topics.COMPLETE, done );
    });
  });

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
          var tiles = SampleTray.tray.getChildren();
          expect( tiles ).to.have.lengthOf(5); // check that extra blank tiles are added
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertPlus( sampleTaxa[0] );
        } );
    });

    it('should render an add button with a single taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "1-2" } )
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          expect( tiles ).to.have.lengthOf(5); // check that extra blank tiles are added
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertPlus( sampleTaxa[1] );
        } );
    });

    it('should render an add button with two taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" } )
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertPlus( sampleTaxa[0] );
        } );
    });

    it('should render an add button with three taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" } ),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" } )
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
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
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" } ),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" } ),
            Alloy.createModel( "taxa", { taxonId: "2", abundance: "1-2" } )
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertPlus( sampleTaxa[1] );
        } );
    });

    it('should render an add button with five taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" } ),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "3-5" } ),
            Alloy.createModel( "taxa", { taxonId: "2", abundance: "1-2" } ),
            Alloy.createModel( "taxa", { taxonId: "4", abundance: "1-2" } )
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertPlus( sampleTaxa[3] );
        } );
    });
 
    it('should display the correct sample entry for each tray position displayed', function() {
        return Promise.resolve()
          .then( function() {
            mocx.createCollection("taxa", [
              Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" }),
              Alloy.createModel( "taxa", { taxonId: "2", abundance: "6-10" }),

              Alloy.createModel( "taxa", { taxonId: "3", abundance: "3-5" }),
              Alloy.createModel( "taxa", { taxonId: "4", abundance: "1-2" }),
              Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" }),
              Alloy.createModel( "taxa", { taxonId: "6", abundance: "6-10" }),

              Alloy.createModel( "taxa", { taxonId: "11", abundance: "1-2" }),
              Alloy.createModel( "taxa", { taxonId: "9", abundance: "1-2" }),
              Alloy.createModel( "taxa", { taxonId: "13", abundance: "1-2" }),
              Alloy.createModel( "taxa", { taxonId: "7", abundance: "3-5" }),

              Alloy.createModel( "taxa", { taxonId: "10", abundance: "11-20" })
            ]);
            setupSampleTray();
          })
          .then( openSampleTray )
          .then( function() {
              var tiles = SampleTray.tray.getChildren();
              expect( tiles ).to.have.lengthOf(5);
              // assert end cap
              assertTaxaBackground( tiles[0], "images/endcap_320.png" );
              var sampleTaxa = getTaxaIcons( tiles[0] );
              expect( sampleTaxa ).to.have.lengthOf(2);
              assertSample( sampleTaxa[0], "/aeshnidae_telephleb_b.png", "3-5" );
              assertSample( sampleTaxa[1], "/amphipoda_b.png", "6-10" );

              // assert first tile
              assertTaxaBackground( tiles[1], "images/tiling_interior_320.png" );
              sampleTaxa = getTaxaIcons( tiles[1] );
              expect( sampleTaxa ).to.have.lengthOf(4);
              assertSample( sampleTaxa[0], "/anisops_b.png", "3-5" );
              assertSample( sampleTaxa[1], "/atalophlebia_b.png", "1-2" );
              assertSample( sampleTaxa[2], "/anostraca_b.png", "1-2" );
              assertSample( sampleTaxa[3], "/aeshnidae_telephleb_b.png", "6-10" );

              // assert second tile
              assertTaxaBackground( tiles[2], "images/tiling_interior_320.png" );
              sampleTaxa = getTaxaIcons( tiles[2] );
              expect( sampleTaxa ).to.have.lengthOf(4);
              assertSample( sampleTaxa[0], "/aeshnidae_telephleb_b.png", "1-2" );
              assertSample( sampleTaxa[1], "/anisops_b.png", "1-2" );
              assertSample( sampleTaxa[2], "/anostraca_b.png", "1-2" );
              assertSample( sampleTaxa[3], "/amphipoda_b.png", "3-5" );

              // // assert third tile
              assertTaxaBackground( tiles[3], "images/tiling_interior_320.png" );
              sampleTaxa = getTaxaIcons( tiles[3] );
              expect( sampleTaxa ).to.have.lengthOf(4);
              assertSample( sampleTaxa[0], "/atalophlebia_b.png", "11-20" );
              assertSampleBlank( sampleTaxa[1] );
              assertPlus( sampleTaxa[2] );
              assertSampleBlank( sampleTaxa[3] );
            });
      });
  });

  context('scrolling a long tray', function() {
    beforeEach(function() {
      // a collection that is long enough to need to scroll
      // and hide tiles and reveal them correctly
      mocx.createCollection("taxa", [
        Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" }), // 0
        Alloy.createModel( "taxa", { taxonId: "2", abundance: "6-10" }),

        Alloy.createModel( "taxa", { taxonId: "3", abundance: "3-5" }), // 1
        Alloy.createModel( "taxa", { taxonId: "4", abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "6", abundance: "6-10" }),

        Alloy.createModel( "taxa", { taxonId: "7", abundance: "1-2" }), // 2
        Alloy.createModel( "taxa", { taxonId: "8", abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "9", abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "10", abundance: "3-5" }),

        Alloy.createModel( "taxa", { taxonId: "11", abundance: "3-5" }), // 3
        Alloy.createModel( "taxa", { taxonId: "12", abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "13", abundance: "3-5" }),
        Alloy.createModel( "taxa", { taxonId: "14", abundance: "6-10" }),

        Alloy.createModel( "taxa", { taxonId: "15", abundance: "3-5" }), // 4
        Alloy.createModel( "taxa", { taxonId: "16", abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "17", abundance: "3-5" }),
        Alloy.createModel( "taxa", { taxonId: "18", abundance: "1-2" }),

        Alloy.createModel( "taxa", { taxonId: "19", abundance: "3-5" }),
        Alloy.createModel( "taxa", { taxonId: "20", abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "21", abundance: "3-5" }),
        Alloy.createModel( "taxa", { taxonId: "22", abundance: "1-2" }),

        Alloy.createModel( "taxa", { taxonId: "23", abundance: "3-5" }),
        Alloy.createModel( "taxa", { taxonId: "24", abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "25", abundance: "3-5" }),
        Alloy.createModel( "taxa", { taxonId: "26", abundance: "1-2" })
      ]);
      setupSampleTray();
    });

    afterEach(cleanupSampleTray);

    /* These tests just check that the leftmost and right most tiles contain
       the data we are expecting after a scroll */

    /* Note: Since order is not well defined in the tile array - depending on
      the implementation - we need to look up expect tile positions by
      there coordinates in the view. */

    it.only('when scrolled to the right it should update the screen properly', function() {
      return Promise.resolve()
          .then( openSampleTray )
          .then( () => SampleTray.getTrayWidth() - SampleTray.getViewWidth() )
          .then( (width) => scrollSampleTray(width)() )
          //.then( updateSampleTrayOnce )
          .then( function() {
            var tiles = SampleTray.tray.getChildren();
           
            // assert last tile
            var tile = findRightMost( tiles  );
            
            assertTaxaBackground( tile, "images/tiling_interior_320.png" );
            var sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            //sampleTaxa[0].getChildren()[0].children[0].children[0].backgroundColor = "red";
            //console.log(`name = ${sampleTaxa[0].getChildren()[0].children[0].children}`);
            //console.log(`backgroundImage = ${sampleTaxa[0].getChildren()[0].backgroundDisabledImage}`);
            assertPlus( sampleTaxa[0] );
            

            // assert second last tile
            tile = findRightMost( tiles, 1);
            
            assertTaxaBackground( tile, "images/tiling_interior_320.png" );
            sampleTaxa = getTaxaIcons( tile );
            
            expect( sampleTaxa ).to.have.lengthOf(4);
            //assertSample( sampleTaxa[0], "/anisops_b.png", "3-5" );
            //assertSample( sampleTaxa[1], "/atalophlebia_b.png", "3-5" );
            //assertSample( sampleTaxa[2], "/anostraca_b.png", "1-2" );
            //assertSample( sampleTaxa[3], "/aeshnidae_telephleb_b.png", "1-2" );
          });

    });

    it('when scrolled to the left it should update the screen properly', function() {
      return Promise.resolve()
          .then( openSampleTray )
          .then( scrollSampleTray(209*4) )
          .then( scrollSampleTray(0) )
          .then( function() {
            var tiles = SampleTray.tray.getChildren();
            expect( tiles ).to.have.lengthOf(5);

            tiles.shift(); // discard end cap since that is always static
          
            // assert left most tile
            var tile = findLeftMost( tiles  );
            assertTaxaBackground( tile, "images/tiling_interior_320.png" );
            
            var sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertSample( sampleTaxa[0], "/anisops_b.png", "3-5" );
            assertSample( sampleTaxa[1], "/atalophlebia_b.png", "1-2" );
            assertSample( sampleTaxa[2], "/anostraca_b.png", "1-2" );
            assertSample( sampleTaxa[3], "/aeshnidae_telephleb_b.png", "6-10" ); 

            // assert rightmost tile
            var tile = findRightMost( tiles );
            assertTaxaBackground( tile, "images/tiling_interior_320.png" );
            sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertSample( sampleTaxa[0], "/atalophlebia_b.png", "3-5" );
            assertSample( sampleTaxa[1], "/amphipoda_b.png", "3-5" );
            assertSample( sampleTaxa[2], "/aeshnidae_telephleb_b.png", "1-2" );
            assertSample( sampleTaxa[3], "/anisops_b.png", "1-2" );
          });
    });
  });

  context('adding and removing taxa', function() {

    afterEach(cleanupSampleTray);
    it('should fire the Topics.KEYSEARCH when the plus icon is clicked and Key selected', function() {
      // now opens MethodSelect open
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", []);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( resolve => {
            Topics.subscribe( Topics.KEYSEARCH, resolve );
            clickPlus( sampleTaxa[0] );
            setTimeout( function() {
              SampleTray.selectMethod.keysearch.getView().fireEvent('click');
            }, 150);
          });
        });
    });

    it('should fire the Topics.BROWSE when the plus icon is clicked and Browse is selected', function() {
      // now opens MethodSelect open
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", []);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( resolve => {
            Topics.subscribe( Topics.BROWSE, resolve );
            clickPlus( sampleTaxa[0] );
            setTimeout( function() {
              SampleTray.selectMethod.browselist.getView().fireEvent('click');
            }, 100);
          });
        });
    });

    it('should fire the Topics.SPEEDBUG when the plus icon is clicked and Speedbug is selected', function() {
      // now opens MethodSelect open
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", []);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( resolve => {
            Topics.subscribe( Topics.SPEEDBUG, resolve );
            clickPlus( sampleTaxa[0] );
            setTimeout( function() {
              SampleTray.selectMethod.speedbug.getView().fireEvent('click');
            }, 100);
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
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].add( Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ) );
          });
        })
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertSample( sampleTaxa[0], "/aeshnidae_telephleb_b.png", "3-5" );
          assertPlus( sampleTaxa[1] );
        });
    });

    it('should update when a taxon is added after first two holes', function() {
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" }),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" }),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" })
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].add( Alloy.createModel( "taxa", { taxonId: "4", abundance: "3-5" } ));
          });
        })
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertSample( sampleTaxa[2], "/anostraca_b.png", "3-5" );
          assertPlus( sampleTaxa[1] );
        });
    });

    it('should update when a taxon is removed from the first two holes', function() {
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" }),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" })
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].remove( Alloy.Collections["taxa"].at(1) );
          });
        })
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertPlus( sampleTaxa[1] );
        });
    });

    it('should update when a taxon is removed after first two holes', function() {
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" }),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" }),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" }),
            Alloy.createModel( "taxa", { taxonId: "2", abundance: "1-2" })
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].remove( Alloy.Collections["taxa"].at(3) );
          });
        })
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertPlus( sampleTaxa[2] );
        });
    });

    it('should fire the IDENTIFY event if a taxon is clicked');

    it('should scroll to the far right upon opening');

    it('should scroll to the far right after adding a new taxon');

    it('should update when a taxon abundance is changed', function() {
      return Promise.resolve()
        .then( function() {
          mocx.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "1-2" }),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" })
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].at(1).set("abundance", "3-5");
          });
        })
        .then( function() {
          var tiles = SampleTray.tray.getChildren();
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertSample( sampleTaxa[1], "/atalophlebia_b.png", "3-5" );
        });
    });
  });
});

require('spec/lib/ti-mocha');
var PlatformSpecific = require('logic/PlatformSpecific');
var { expect } = require('spec/lib/chai');
var { closeWindow, checkTestResult, actionFiresTopicTest, setManualTests, resetDatabase, waitFor } = require('spec/util/TestUtils');
var { makeTestServices } = require('spec/fixtures/Services_fixture');

var Topics = require('ui/Topics');
 
var { speedBugIndexMock } = require('spec/mocks/MockSpeedbug');
var { keyMock } = require('spec/mocks/MockKey');
keyMock.addSpeedbugIndex( speedBugIndexMock );

var SampleTrayModel = require('models/SampleTray');
var Taxon = require('models/Taxon');

describe( 'SampleTray controller', function() {

  var view, SampleTray, SampleTrayWin, openArgs;

  beforeEach( function() {
    resetDatabase();
  });

  // The tray now opens through the View seam so the Titanium-free
  // lib/mvvm/controllers/SampleTray wires the view-model and the two tray
  // collections; setup just records the args (create+open happen in openView).
  function setupSampleTray( extraArgs ) {
    view = makeTestServices().View;
    // Production threads the current sample+taxa into the tray's args via
    // Navigation (seeded off SURVEY_STARTED); here we inject the collection the
    // test just set up plus the sample singleton the same way.
    openArgs = Object.assign({
      key: keyMock,
      taxa: Alloy.Collections.instance("taxa"),
      sample: Alloy.Models.instance("sample"),
    }, extraArgs);
  }

  // The Alloy shell no longer holds the view-model — reach it through the View
  // seam. The tray is driven entirely by bindView now, so tests synchronise on the
  // view-model's own notifications / scroll state, not shell-fired events.
  function trayVm() { return view.getScreenController().vm; }

  function updateSampleTrayOnce(resolve) {
    var vm = trayVm();
    function onNotify() {
      vm.removeListener(onNotify);
      setTimeout( resolve, 10 );
    }
    vm.addListener(onNotify);
  }

  // openView creates the controller + screen controller synchronously (before the
  // returned promise resolves on window-opened), so we grab the shell and subscribe
  // to the view-model's first notify / the scroll settle before they can fire on
  // the postlayout measurement.
  function openSampleTray() {
    view.openView("SampleTray", openArgs);
    SampleTray = view.getCurrentController();
    SampleTrayWin = SampleTray.getView();
    return new Promise( function( resolve, reject ) {
          // Poll the settled scroll state directly rather than waiting for the VM's
          // scrollToRightEnd edge: on the Android emulator the initial measure can
          // fire that event synchronously inside openView() above — before this
          // listener would attach — leaving an event-gated wait hung to the 30s
          // ceiling. The open path has no prior settled edge to confuse with (unlike
          // an add, which must wait for the *post-add* scroll), so a direct poll is
          // race-free.
          var scrollDone = waitFor(scrollSettled);
          updateSampleTrayOnce(function() {
            try {
              var actualHeight = SampleTray.content.size.height + SampleTray.getAnchorBar().getView().size.height;
              var expectedHeight = SampleTray.getView().size.height;
              expect( Math.abs(actualHeight - expectedHeight) ).to.be.at.most(1,
                `content (${SampleTray.content.size.height}) + anchorBar (${SampleTray.getAnchorBar().getView().size.height}) should equal window (${expectedHeight})`);
              scrollDone.then(resolve, reject);
            } catch( err ) {
                reject(err);
            }
          });
        });
  }

  // True once the ScrollView has settled at its right edge. The ScrollView clamps
  // its offset to (contentWidth - viewportWidth). After a taxa add the VM's target
  // jumps immediately, but the tray takes a layout pass to widen; two things follow.
  // First, don't settle until the tray has actually laid out to its full new width
  // (reachable reaches the target) — otherwise we'd settle on the stale pre-add edge
  // before the new tile renders. Second, the tray's dip-derived width leaves the
  // reachable max a rounding-pixel short of the dip-derived target, so settle cur
  // against that reachable max, not the target.
  function scrollSettled() {
    var target = trayVm().scrollTargetX;
    if ( target <= 0 ) return true;   // short tray: nothing to scroll
    var off = SampleTray.content.contentOffset;
    var cur = off ? (off.x || 0) : 0;
    var reachable = SampleTray.tray.size.width - SampleTray.content.size.width;
    var TOL = 2;   // dip <-> system rounding across the geometry chain
    return reachable >= target - TOL && Math.abs(cur - Math.min(target, reachable)) < TOL;
  }

  // The scroll-to-right is a bindView command now. It is edge-triggered like the
  // shell's old `scrollrightend`: wait for the view-model's next scrollToRightEnd
  // intent (fired on measure / refresh), then poll (scrollSettled) — so a call made
  // before an add waits for the post-add scroll, not the already-settled current
  // edge. The open path can't use this (its measure may fire the intent before a
  // listener attaches); it polls scrollSettled directly instead.
  function waitForScrollEnd() {
    var vm = trayVm();
    return new Promise(function(resolve, reject) {
      function onIntent() {
        vm.off("scrollToRightEnd", onIntent);
        resolve(waitFor(scrollSettled));
      }
      vm.on("scrollToRightEnd", onIntent);
    });
  }

  function scrollSampleTray( x ) {
    return function() {
      return new Promise( function( resolve ) {
          var targetPx = PlatformSpecific.convertDipToSystem(x);
          var contentOffset = SampleTray.content.contentOffset;
          var currentPx = contentOffset ? (contentOffset.x || 0) : 0;
          if ( Math.abs( currentPx - targetPx ) < 2.0 ) {
            setTimeout( resolve, 5 );
            return;
          }
          function isAtScrollX(e) {
            if ( Math.abs(e.x - targetPx) < 2.0 ) {
              SampleTray.content.removeEventListener("scroll",isAtScrollX);
              setTimeout( resolve, 5 );
            }
          }
          SampleTray.content.addEventListener("scroll", isAtScrollX );
          SampleTray.content.scrollTo( targetPx, 0, { animate: true } );
        });
    }
  }

  function cleanupSampleTray( done ) {
    closeWindow( SampleTrayWin, done );
  }

  function findLeftMost(arr,i=0) {
    var sorted = arr.slice(0).sort( (a,b) => a.rect.x - b.rect.x );
    return sorted[i];
  }

  function findRightMost(arr,i=0) {
    var sorted = arr.slice(0).sort( (a,b) => b.rect.x - a.rect.x );
    return sorted[i];
  }

  // Poll the rendered tray until the content assertions hold. Settling the scroll
  // only guarantees the offset; under load the windowed tile a scroll reveals is
  // created — and its slot images bound — a beat later, so a one-shot assertion
  // races the render. waitFor swallows the assertion throw and retries to the
  // deadline, so a genuine mismatch still fails (as a timeout).
  function assertEventually( assertFn ) {
    return waitFor( function() { assertFn(); return true; } );
  }

  // A cell is one of two polymorphic slot components: a SampleTaxaIcon (taxon/blank,
  // children = [ padIcon, tapSurface ]; padIcon holds [ icon, abundance ]) or a
  // SampleTrayPlus (add, children = [ plus, tapSurface ]). In both, the tap surface
  // (last child) is the single transparent hit target and the first child carries
  // the visible content.
  function assertSample( taxon, image, abundance ) {
    var [ icon, label ] = taxon.children[0].children;
    expect( icon.image, `Expected the the taxon to be ${image}` ).to.include( image );
    expect( label.text, `Expected the abundance label to be ${abundance}` ).to.equal( abundance );
  }

  function tapSurface( square ) { return square.children[square.children.length - 1]; }
  function plusIcon( square ) { return square.children[0]; }

  function clickPlus( square ) {
    tapSurface( square ).fireEvent('click');
  }

  function assertPlus( square ) {
    expect( plusIcon( square ).image ).to.include('images/plus-icon.png');
  }

  // An empty cell shows nothing — its first child (the icon pad on a blank
  // SampleTaxaIcon, or the plus on an invisible add-behind SampleTrayPlus) is hidden.
  function assertSampleBlank( cell ) {
    expect( cell.children[0].visible, "an empty cell shows nothing" ).to.equal(false);
  }

  function assertTaxaBackground( tile, image ) {
    expect( tile.children[0].image ).to.include(image);
  }

  function getTaxaIcons( tile ) {
    return tile.children[1].children;
  }

  // A taxon cell's children are [ padIcon, verdict, tapSurface ]; the verdict
  // overlay is the middle child and the abundance badge is padIcon's 2nd child.
  function verdictOf( cell ) { return cell.children[1]; }
  function abundanceOf( cell ) { return cell.children[0].children[1]; }

  function assertVerdict( cell, image ) {
    expect( verdictOf( cell ).visible, "the verdict overlay should be visible" ).to.equal(true);
    expect( verdictOf( cell ).image, `Expected the verdict to be ${image}` ).to.include(image);
  }

  async function simulateEditTaxonEvent() {
    return new Promise( (resolve) => {
      Topics.subscribe( Topics.IDENTIFY, function handler(data) {
        Topics.unsubscribe(Topics.IDENTIFY,handler);
        resolve(data);
      });
      // Fire the tap on the rendered endcap cell's tap surface (its last child) —
      // the single hit target the slot owns.
      tapSurface( getTaxaIcons( SampleTray.tray.children[0] )[0] ).fireEvent("click");
    });
  }

  context( 'event handling', function(){

    beforeEach( function() {
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa");
          setupSampleTray();
        })
        .then( openSampleTray );
    });

    afterEach(cleanupSampleTray);

    it('should fire the NOTES topic', function(done) {
      actionFiresTopicTest( SampleTray.nextButton.NavButton, 'click', Topics.NOTES, () => done() );
    });

    it('returns to Habitat when Back is tapped in a survey', function(done) {
      actionFiresTopicTest( SampleTray.backButton.NavButton, 'click', Topics.HABITAT, () => done() );
    });
  });

  context( 'rendering', function() {
    afterEach(cleanupSampleTray);
    it('should render an add button with a blank tray', function (){
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa");
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          expect( tiles.length ).to.be.at.least(4); // check that extra blank tiles are added
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertPlus( sampleTaxa[0] );
        } );
    });

    it('should render an add button with a single taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "1-2" } )
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          expect( tiles.length ).to.be.at.least(4); // check that extra blank tiles are added
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertPlus( sampleTaxa[1] );
        } );
    });

    it('should render an add button with two taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa",  [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" } )
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( tiles.length ).to.be.at.least(4); 
          assertPlus( sampleTaxa[0] );
        } );
    });

    it('should render an add button with three taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa",  [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" } ),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" } )
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          expect( tiles.length ).to.be.at.least(4); 

          var sampleTaxa = getTaxaIcons( tiles[1] );
          assertSampleBlank( sampleTaxa[1] );
          assertPlus( sampleTaxa[2] );
        } );
    });

    it('should render an add button with four taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa",  [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" } ),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" } ),
            Alloy.createModel( "taxa", { taxonId: "2", abundance: "1-2" } )
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( tiles.length ).to.be.at.least(4); 
          assertPlus( sampleTaxa[1] );
        } );
    });

    it('should render an add button with five taxa in the tray', function (){
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa",  [
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
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( tiles.length ).to.be.at.least(4); 
          assertPlus( sampleTaxa[3] );
        } );
    });
 
    it('should display the correct sample entry for each tray position displayed', function() {
        return Promise.resolve()
          .then( function() {
            Alloy.Collections.taxa = Alloy.createCollection("taxa",  [
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
              var tiles = SampleTray.tray.children;
              expect( tiles.length ).to.be.at.least(4); 
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
      Alloy.Collections.taxa = Alloy.createCollection("taxa",  [
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

    it('when scrolled to the right it should update the screen properly', function() {
      return Promise.resolve()
          .then( openSampleTray )
          .then( scrollSampleTray(0) )           // scroll back to left
          .then( () => trayVm().trayWidth - trayVm().viewWidth )
          .then( (width) => scrollSampleTray(width)() )
          .then( () => assertEventually( function() {
            var tiles = SampleTray.tray.children;
            var tile = findRightMost( tiles );
            assertTaxaBackground( tile, "images/tiling_interior_320.png" );
            var sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertPlus( sampleTaxa[0] );
          }));

    });

    it('when scrolled to the left it should update the screen properly', function() {
      return Promise.resolve()
          .then( openSampleTray )
          .then( () => trayVm().trayWidth - trayVm().viewWidth )
          .then( (maxX) => scrollSampleTray(maxX)() )
          .then( scrollSampleTray(0) )
          .then( () => assertEventually( function() {
            var tiles = SampleTray.tray.children;
            expect( tiles.length ).to.be.at.least(4);

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
          }));
    });

    it('should scroll to the far right upon opening', function() {
      return Promise.resolve()
          .then( openSampleTray )
          .then( () => assertEventually( () => {
            var tiles = SampleTray.tray.children;
            tiles.shift();
            var tile = findRightMost( tiles );
            var sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertPlus( sampleTaxa[0] );
          }))
    });

   
  });

  context('adding and removing taxa', function() {

    afterEach(cleanupSampleTray);
    it('should scroll to the far right after adding 26th taxon', function() {

      return Promise.resolve()
          .then( function() {
            Alloy.Collections.taxa = Alloy.createCollection("taxa", [
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
              Alloy.createModel( "taxa", { taxonId: "25", abundance: "3-5" })
            ]);
            setupSampleTray();
          })
          .then( openSampleTray )
          .then( () => {
            var scrollDone = waitForScrollEnd();
            Alloy.Collections["taxa"].add( Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ) );
            return scrollDone;
           })
          .then( () => assertEventually( () => {
            var tiles = SampleTray.tray.children;
            tiles.shift();
            var tile = findRightMost( tiles );
            var sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertPlus( sampleTaxa[0] );
            expect( SampleTray.tray.size.width ).to.be.above( SampleTray.content.size.width );
          }));
    });

    it('should scroll to the far right after adding 27th taxon', function() {

      return Promise.resolve()
          .then( function() {
            Alloy.Collections.taxa = Alloy.createCollection("taxa", [
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
          })
          .then( openSampleTray )
          .then( () => {
            var scrollDone = waitForScrollEnd();
            Alloy.Collections["taxa"].add( Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ) );
            return scrollDone;
           })
          .then( () => assertEventually( () => {
            var tiles = SampleTray.tray.children;
            tiles.shift();
            var tile = findRightMost( tiles );
            var sampleTaxa = getTaxaIcons( tile );
            expect( sampleTaxa ).to.have.lengthOf(4);
            assertPlus( sampleTaxa[2] );
            expect( SampleTray.tray.size.width ).to.be.above( SampleTray.content.size.width );
          }));
    });

    // The plus icon opens the identification-method chooser for adding to the
    // current sample. The selection -> topic routing (Key/Speedbug/Browse/
    // Unknown) now lives in the MethodSelect modal — see
    // test/controllers/MethodSelect_spec.js.
    it('fires SELECT_METHOD for adding to the sample when the plus icon is clicked', function() {
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa");
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( resolve => {
            Topics.subscribe( Topics.SELECT_METHOD, function(data) {
              expect( data.allowAddToSample, "adds the selection to the current sample" ).to.equal(true);
              expect( data.unknownBug, "offers the unknown-bug option from the tray" ).to.equal(true);
              resolve();
            });
            clickPlus( sampleTaxa[0] );
          });
        });
    });

    it('should update when a taxon is added in first two holes', function() {
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa");
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].add( Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" } ) );
          });
        })
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertSample( sampleTaxa[0], "/aeshnidae_telephleb_b.png", "3-5" );
          assertPlus( sampleTaxa[1] );
        });
    });

    it('should update when a taxon is added after first two holes', function() {
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" }),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" }),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" })
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].add( Alloy.createModel( "taxa", { taxonId: "4", abundance: "3-5" } ));
          });
        })
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertSample( sampleTaxa[2], "/anostraca_b.png", "3-5" );
          assertPlus( sampleTaxa[1] );
        });
    });

    it('should update when a taxon is removed from the first two holes', function() {
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa",[
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" }),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" })
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].remove( Alloy.Collections["taxa"].at(1) );
          });
        })
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertPlus( sampleTaxa[1] );
        });
    });

    it('should update when a taxon is removed after first two holes', function() {
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" }),
            Alloy.createModel( "taxa", { taxonId: "3", abundance: "1-2" }),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" }),
            Alloy.createModel( "taxa", { taxonId: "2", abundance: "1-2" })
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].remove( Alloy.Collections["taxa"].at(3) );
          });
        })
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[1] );
          expect( sampleTaxa ).to.have.lengthOf(4);
          assertPlus( sampleTaxa[2] );
        });
    });

    // FIXME: This could be scoped at the SampleTaxaIcon level
    it('should fire the IDENTIFY event if a taxon is clicked', async function() {
      let taxa = [
        Alloy.createModel( "taxa", { taxonId: "1", abundance: "3-5" })
      ];
      taxa[0].save();
      Alloy.Collections.taxa = Alloy.createCollection("taxa", taxa);
      setupSampleTray();
      await openSampleTray(); 
      let data = await simulateEditTaxonEvent();
      expect( data.sampleTaxonId ).to.equal(taxa[0].get("sampleTaxonId"));
    });

    it('should update when a taxon abundance is changed', function() {
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "1-2" }),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" })
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].at(1).set("abundance", "3-5");
          });
        })
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          assertSample( sampleTaxa[1], "/atalophlebia_b.png", "3-5" );
        });
    });

    it('should still raise click handler when taxon is added', function() {
      return Promise.resolve()
        .then( function() {
          Alloy.Collections.taxa = Alloy.createCollection("taxa", [
            Alloy.createModel( "taxa", { taxonId: "1", abundance: "1-2" }),
            Alloy.createModel( "taxa", { taxonId: "5", abundance: "1-2" })
          ]);
          setupSampleTray();
        })
        .then( openSampleTray )
        .then( function() {
          var tiles = SampleTray.tray.children;
          var sampleTaxa = getTaxaIcons( tiles[0] );
          expect( sampleTaxa ).to.have.lengthOf(2);
          return new Promise( function(resolve) {
              updateSampleTrayOnce(resolve);
              Alloy.Collections["taxa"].add( Alloy.createModel( "taxa", { taxonId: "4", abundance: "3-5" } ));
          });
        })
        .then( function() {
          return new Promise( (resolve) => {  Topics.subscribe( Topics.IDENTIFY, function handler(data) {
              Topics.unsubscribe(Topics.IDENTIFY,handler);
              checkTestResult(resolve, function() {
                expect( data.taxonId).to.equal(4);
              });

            });
            // Fire on the first interior tile's first cell (the added taxon) —
            // the slot's tap surface (last child).
            tapSurface( getTaxaIcons( SampleTray.tray.children[1] )[0] ).fireEvent("click");
          });
        });
    });
  });

  context('training feedback', function() {
    // Training mode (args.training) hides abundance and, once assessed, overlays a
    // tick/cross on each taxon from the injected assessor (keyed by sampleTaxonId).
    // A fake assessor marks even ids correct / odd incorrect for a visible mix.
    // Runnable in --manual to eyeball the overlay placement against the design:
    //   npx grunt --platform=ios --simulator --liveview --reuse-server \
    //     --grep="training feedback reveals" --manual unit-test
    var mixedAssessor = {
      assess: function( taxa ) {
        var verdicts = {};
        taxa.forEach( function( t ) {
          if ( t && t.sampleTaxonId != null )
            verdicts[t.sampleTaxonId] = ( t.sampleTaxonId % 2 === 0 ) ? "correct" : "incorrect";
        });
        return verdicts;
      },
    };

    beforeEach( function() {
      Alloy.Models.instance("sample");
      Alloy.Collections.taxa = Alloy.createCollection("taxa", [
        Alloy.createModel( "taxa", { taxonId: "1", sampleTaxonId: 1, abundance: "3-5" }),
        Alloy.createModel( "taxa", { taxonId: "2", sampleTaxonId: 2, abundance: "6-10" }),
        Alloy.createModel( "taxa", { taxonId: "3", sampleTaxonId: 3, abundance: "3-5" }),
        Alloy.createModel( "taxa", { taxonId: "4", sampleTaxonId: 4, abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "5", sampleTaxonId: 5, abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "6", sampleTaxonId: 6, abundance: "6-10" }),
        Alloy.createModel( "taxa", { taxonId: "7", sampleTaxonId: 7, abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "8", sampleTaxonId: 8, abundance: "1-2" }),
        Alloy.createModel( "taxa", { taxonId: "9", sampleTaxonId: 9, abundance: "3-5" }),
        Alloy.createModel( "taxa", { taxonId: "10", sampleTaxonId: 10, abundance: "6-10" }),
      ]);
      view = makeTestServices({ assessor: mixedAssessor }).View;
      openArgs = {
        key: keyMock,
        training: true,
        taxa: Alloy.Collections.instance("taxa"),
        sample: Alloy.Models.instance("sample"),
      };
      return openSampleTray();
    });

    afterEach(cleanupSampleTray);

    it('hides the abundance badge in training mode', function() {
      var endcap = getTaxaIcons( SampleTray.tray.children[0] );
      expect( abundanceOf( endcap[0] ).visible, "abundance is hidden in training" ).to.equal(false);
      expect( endcap[0].children[0].visible, "the silhouette still shows" ).to.equal(true);
    });

    it('shows no verdict overlay until the tray is assessed', function() {
      var endcap = getTaxaIcons( SampleTray.tray.children[0] );
      expect( verdictOf( endcap[0] ).visible ).to.equal(false);
    });

    it('reveals a tick or cross on each taxon once assessed', function() {
      trayVm().assess();
      return assertEventually( function() {
        var endcap = getTaxaIcons( SampleTray.tray.children[0] );
        // endcap cells map to collection indices [0,1] → sampleTaxonId 1 (odd →
        // cross) and 2 (even → tick).
        assertVerdict( endcap[0], "cross-icon.png" );
        assertVerdict( endcap[1], "tick-icon.png" );
      });
    });

    it('grades the tray when the Assess anchor button is tapped', function() {
      SampleTray.assessButton.NavButton.fireEvent("click");
      return assertEventually( function() {
        var endcap = getTaxaIcons( SampleTray.tray.children[0] );
        assertVerdict( endcap[0], "cross-icon.png" );
        assertVerdict( endcap[1], "tick-icon.png" );
      });
    });

    it('returns to the menu when Back is tapped in training', function(done) {
      actionFiresTopicTest( SampleTray.backButton.NavButton, 'click', Topics.HOME, () => done() );
    });

    it('clears the feedback when a taxon is edited', function() {
      trayVm().assess();
      return assertEventually( function() {
        assertVerdict( getTaxaIcons( SampleTray.tray.children[0] )[0], "cross-icon.png" );
      }).then( function() {
        Alloy.Collections.taxa.at(0).set("abundance", "1-2");
        return assertEventually( function() {
          expect( verdictOf( getTaxaIcons( SampleTray.tray.children[0] )[0] ).visible ).to.equal(false);
        });
      });
    });
  });

  context('incorrect-assessment notice', function() {
    // After Assess, a wrong identification surfaces a non-modal notice near the top
    // that fades away on its own. The notice must let taps through to the taxa.
    function verdictAssessor(verdict) {
      return { assess: function (taxa) {
        var v = {};
        taxa.forEach(function (t) { if (t && t.sampleTaxonId != null) v[t.sampleTaxonId] = verdict; });
        return v;
      } };
    }

    function openWithAssessor(assessor, noticeDwellMs) {
      Alloy.Models.instance("sample");
      Alloy.Collections.taxa = Alloy.createCollection("taxa", [
        Alloy.createModel("taxa", { taxonId: "1", sampleTaxonId: 1, abundance: "3-5" }),
        Alloy.createModel("taxa", { taxonId: "2", sampleTaxonId: 2, abundance: "6-10" }),
      ]);
      view = makeTestServices({ assessor: assessor }).View;
      openArgs = {
        key: keyMock,
        training: true,
        taxa: Alloy.Collections.instance("taxa"),
        sample: Alloy.Models.instance("sample"),
        noticeDwellMs: noticeDwellMs,
      };
      return openSampleTray();
    }

    afterEach(cleanupSampleTray);

    it('shows the notice when an assessment has an incorrect taxon', function () {
      return openWithAssessor(verdictAssessor("incorrect"), 4000).then(function () {
        trayVm().assess();
        // visible is the bound VM state; opacity > 0.9 confirms the fadeInNotice
        // command actually animated it up (not just left it transparent).
        return waitFor(function () {
          return SampleTray.incorrectNotice.visible === true
            && SampleTray.incorrectNotice.opacity > 0.9;
        });
      });
    });

    it('keeps the notice hidden when every taxon is correct', function () {
      return openWithAssessor(verdictAssessor("correct"), 4000).then(function () {
        trayVm().assess();
        expect(SampleTray.incorrectNotice.visible).to.equal(false);
      });
    });

    it('lets taps through to the taxa underneath (non-modal)', function () {
      return openWithAssessor(verdictAssessor("incorrect"), 4000).then(function () {
        expect(SampleTray.incorrectNotice.touchEnabled).to.equal(false);
      });
    });

    it('fades the notice away after its dwell', function () {
      // Short dwell so the auto-hide is observable quickly (production dwell is 4s).
      return openWithAssessor(verdictAssessor("incorrect"), 300).then(function () {
        trayVm().assess();
        return waitFor(function () { return SampleTray.incorrectNotice.visible === true; })
          .then(function () {
            return waitFor(function () { return SampleTray.incorrectNotice.visible === false; });
          });
      });
    });
  });

  context('training tray (domain aggregate)', function() {
    // A training session threads the SampleTray domain aggregate (args.tray), not
    // the survey's Alloy taxa collection. The controller must build a
    // TrainingTraySource over it — proven here by rendering with no args.taxa, and
    // by the tray re-rendering when a taxon is added straight to the aggregate.
    var trainingTray;

    beforeEach(function() {
      trainingTray = new SampleTrayModel([
        new Taxon({ id: 1, taxonId: 1, position: 0 }),
        new Taxon({ id: 2, taxonId: 2, position: 1 }),
      ]);
      view = makeTestServices().View;
      openArgs = { key: keyMock, training: true, tray: trainingTray };
      return openSampleTray();
    });

    afterEach(cleanupSampleTray);

    function silhouetteOf( cell ) { return cell.children[0].children[0]; }

    it('renders the tray taxa from the domain aggregate, with abundance hidden', function() {
      var endcap = getTaxaIcons( SampleTray.tray.children[0] );
      expect( endcap ).to.have.lengthOf(2);
      expect( silhouetteOf( endcap[0] ).image ).to.include('/aeshnidae_telephleb_b.png');
      expect( abundanceOf( endcap[0] ).visible, "abundance is hidden in training" ).to.equal(false);
    });

    it('re-renders when a taxon is added straight to the aggregate', function() {
      return new Promise(function(resolve) {
        updateSampleTrayOnce(resolve);
        trainingTray.add( new Taxon({ id: 3, taxonId: 3, position: 2 }) );
      }).then(function() {
        return assertEventually(function() {
          var sampleTaxa = getTaxaIcons( SampleTray.tray.children[1] );
          expect( silhouetteOf( sampleTaxa[0] ).image ).to.include('/anisops_b.png');
        });
      });
    });
  });

  context('editing taxon and model persistence',function() {

    function simulateUserEdit(value, photoPath ) {
      Ti.API.debug(`simulateUserEdit: ${photoPath}`);
      return new Promise( (resolve) => {
        SampleTray.editTaxon.photoSelect.on("photoTaken", function handler() {
          SampleTray.editTaxon.photoSelect.off("photoTaken", handler);
          resolve();
        } );
        SampleTray.editTaxon.abundanceValue.value = value;
        SampleTray.editTaxon.abundanceValue.fireEvent("change");
        SampleTray.editTaxon.photoSelect.on("loaded", function handler() {
          SampleTray.editTaxon.photoSelect.off("loaded", handler);
          SampleTray.editTaxon.photoSelect.trigger("photoTaken", SampleTray.editTaxon.photoSelect.getFullPhotoUrl() );
        });
        Ti.API.debug(`setImage in simulate: ${photoPath}`);
        SampleTray.editTaxon.photoSelect.setImage(photoPath);
      });
    }

    async function openGallery() {
      return new Promise( (resolve) => {
        Topics.subscribe( Topics.GALLERY, function handler(data) {
          Topics.unsubscribe( Topics.GALLERY, handler);
          resolve(data.photos[0]);
            
        });
        setTimeout( () => SampleTray.editTaxon.photoSelect.magnify.fireEvent("click"), 500 );
      });
    }

    async function closeSampleTray() {
      SampleTrayWin.close();
    }

    

    async function openSampleTrayToEdit( taxonId ) {
      setupSampleTray({ taxonId: taxonId });
      await openSampleTray();
      await waitFor( () => SampleTray.editTaxon.photoSelect.getThumbnailImageUrl() );
    }

    async function openSampleTrayReadOnly( taxonId ) {
      setupSampleTray({ taxonId: taxonId, readonly: true });
      await openSampleTray();
      await waitFor( () => SampleTray.editTaxon.photoSelect.getThumbnailImageUrl() );
    }

    async function simulateSaveTaxon() {
      
      return new Promise( (resolve) => {
        SampleTray.on("taxonSaved", resolve );
        SampleTray.editTaxon.saveButton.fireEvent("click");
      });
    }

    beforeEach(async function() {
      var sampleColl = Alloy.Collections.instance("sample");
      sampleColl.createNewSample();
      Alloy.Collections.instance("taxa").load( Alloy.Models.sample.get("sampleId") );
    });
    
    afterEach(cleanupSampleTray);

    it('should display an empty tray', async function() {
      await openSampleTrayToEdit(1);
      var tiles = SampleTray.tray.children;
      var sampleTaxa = getTaxaIcons( tiles[0] );
      expect( sampleTaxa ).to.have.lengthOf(2);
      assertPlus( sampleTaxa[0] );
    });
    
    it('should persist temporary taxon if closed before saving', async function() {
      
      await openSampleTrayToEdit(1);

      expect( SampleTray.editTaxon.taxonName.text).to.equal("Aeshnidae Telephleb");
      expect( SampleTray.editTaxon ).to.be.ok;
      expect( SampleTray.editTaxon.abundanceLabel.text ).to.equal("1-2");
      expect( SampleTray.editTaxon.isDefaultPhoto() ).to.be.true;
      
      
      await simulateUserEdit(21, "/spec/resources/simpleKey1/media/amphipoda_01.jpg");
      await closeSampleTray();
      await openSampleTrayToEdit(1);

      expect( SampleTray.editTaxon.abundanceLabel.text ).to.equal("> 20");
      expect( SampleTray.editTaxon.isDefaultPhoto() ).to.be.false;
      expect( SampleTray.editTaxon.photoSelect.getThumbnailImageUrl()).to.include("preview_thumbnail");

    });
    it('should persist switch the temporary taxon to the newly selectly taxon after selection', async function() {
      
      // first ensure there is a temporary unsaved taxon and photo
      await openSampleTrayToEdit(1);

      expect( SampleTray.editTaxon.taxonName.text).to.equal("Aeshnidae Telephleb");
      expect( SampleTray.editTaxon ).to.be.ok;
      expect( SampleTray.editTaxon.abundanceLabel.text ).to.equal("1-2");
      expect( SampleTray.editTaxon.isDefaultPhoto() ).to.be.true;
      
      await simulateUserEdit(21, "/spec/resources/simpleKey1/media/amphipoda_01.jpg");
      await closeSampleTray();

      await openSampleTrayToEdit(2);

      expect( SampleTray.editTaxon.taxonName.text).to.equal("Amphipoda");
      expect( SampleTray.editTaxon.abundanceLabel.text ).to.equal("1-2");
      expect( SampleTray.editTaxon.isDefaultPhoto() ).to.be.true;
    });

    it('should open the gallery with the correct temporary image url', async function() { 
      await openSampleTrayToEdit(1);
      await simulateUserEdit(21, "/spec/resources/simpleKey1/media/amphipoda_01.jpg");
      var photoUrl = await openGallery();
      expect(photoUrl).to.include("_1"); // make sure the correct photo url is sent
    });

    it('should persist a saved taxon to the new sample', async function() {
      await openSampleTrayToEdit(1);
      await simulateUserEdit(21, "/spec/resources/simpleKey1/media/amphipoda_01.jpg");
      await simulateSaveTaxon();

      var sampleId = Alloy.Models.sample.get("sampleId");
      Alloy.Models.sample.loadById(sampleId);
      var taxon = Alloy.Collections.taxa.at(0);

      expect( taxon ).to.be.ok;
      expect( taxon.get("sampleId") ).to.equal(sampleId);
      expect( taxon.get("abundance") ).to.equal("> 20");
      expect( taxon.get("taxonId") ).to.equal(1);
      expect( taxon.get("taxonPhotoPath") ).to.include(`taxon_${sampleId}`);
      expect( taxon.get("serverCreaturePhotoId") ).to.equal(undefined);

    });
    it('should load the persisted data when editing taxon', async function() {
      await openSampleTrayToEdit(1);
      await simulateUserEdit(21, "/spec/resources/simpleKey1/media/amphipoda_01.jpg");
      await simulateSaveTaxon();
      await simulateEditTaxonEvent();
      await closeSampleTray();
      await openSampleTrayToEdit(1);
      expect( SampleTray.editTaxon.taxonName.text).to.equal("Aeshnidae Telephleb");
      expect( SampleTray.editTaxon.abundanceLabel.text ).to.equal("> 20");
      expect( SampleTray.editTaxon.isDefaultPhoto() ).to.be.false;
      expect( SampleTray.editTaxon.photoSelect.getThumbnailImageUrl()).to.include("preview_thumbnail");
    });
    it('should pass through the readonly flag to the EditTaxon screen', async function() {
      await openSampleTrayReadOnly(1);
      expect( SampleTray.editTaxon.args.readonly ).to.be.true;
    });

    
  });
  describe("Unknown bugs", function() {
    it("should display multiple unknown bugs", async function() {
      Alloy.Collections.taxa = Alloy.createCollection("taxa", [
        Alloy.createModel( "taxa", { taxonId: null, abundance: "3-5" }),
        Alloy.createModel( "taxa", { taxonId: null, abundance: "1-2" })
      ]);
      setupSampleTray();
      await openSampleTray();
      var tiles = SampleTray.tray.children;
      var sampleTaxa = getTaxaIcons( tiles[0] );
      expect( sampleTaxa ).to.have.lengthOf(2);
      assertSample( sampleTaxa[0], "/images/unknown-bug-icon.png", "3-5" );
      assertSample( sampleTaxa[1], "/images/unknown-bug-icon.png", "1-2" );
    });
  })
});

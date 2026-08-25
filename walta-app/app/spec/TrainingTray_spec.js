require('spec/lib/ti-mocha');
var PlatformSpecific = require('logic/PlatformSpecific');
var { expect } = require('spec/lib/chai');
var { closeWindow, actionFiresTopicTest, resetDatabase, waitFor } = require('spec/util/TestUtils');
var { makeTestServices } = require('spec/fixtures/Services_fixture');

var Topics = require('ui/Topics');

var { speedBugIndexMock } = require('spec/mocks/MockSpeedbug');
var { keyMock } = require('spec/mocks/MockKey');
keyMock.addSpeedbugIndex( speedBugIndexMock );

var SampleTrayModel = require('models/SampleTray');
var Taxon = require('models/Taxon');

describe( 'TrainingTray controller', function() {

  var view, TrainingTray, TrainingTrayWin, openArgs;

  beforeEach( function() {
    resetDatabase();
  });

  function trayVm() { return view.getScreenController().vm; }

  function updateTrainingTrayOnce(resolve) {
    var vm = trayVm();
    function onNotify() {
      vm.removeListener(onNotify);
      setTimeout( resolve, 10 );
    }
    vm.addListener(onNotify);
  }

  // True once the ScrollView has settled at its right edge — mirrors
  // SampleTray_spec.js's scrollSettled (see there for the rounding-tolerance
  // rationale).
  function scrollSettled() {
    var target = trayVm().scrollTargetX;
    if ( target <= 0 ) return true;
    var off = TrainingTray.content.contentOffset;
    var cur = off ? (off.x || 0) : 0;
    var reachable = TrainingTray.tray.size.width - TrainingTray.content.size.width;
    var TOL = 2;
    return reachable >= target - TOL && Math.abs(cur - Math.min(target, reachable)) < TOL;
  }

  function openTrainingTray() {
    view.openView("TrainingTray", openArgs);
    TrainingTray = view.getCurrentController();
    TrainingTrayWin = TrainingTray.getView();
    return new Promise( function( resolve, reject ) {
      var scrollDone = waitFor(scrollSettled);
      updateTrainingTrayOnce(function() {
        try {
          var actualHeight = TrainingTray.content.size.height + TrainingTray.getAnchorBar().getView().size.height;
          var expectedHeight = TrainingTray.getView().size.height;
          expect( Math.abs(actualHeight - expectedHeight) ).to.be.at.most(1,
            `content (${TrainingTray.content.size.height}) + anchorBar (${TrainingTray.getAnchorBar().getView().size.height}) should equal window (${expectedHeight})`);
          scrollDone.then(resolve, reject);
        } catch( err ) {
          reject(err);
        }
      });
    });
  }

  function cleanupTrainingTray( done ) {
    closeWindow( TrainingTrayWin, done );
  }

  // Poll the rendered tray until the content assertions hold — see
  // SampleTray_spec.js's assertEventually for the race it guards against.
  function assertEventually( assertFn ) {
    return waitFor( function() { assertFn(); return true; } );
  }

  function getTaxaIcons( tile ) {
    return tile.children[1].children;
  }

  // A taxon cell's children are [ padIcon, verdict, tapSurface ]; the verdict
  // overlay is the middle child and the abundance badge is padIcon's 2nd child.
  function verdictOf( cell ) { return cell.children[1]; }
  function abundanceOf( cell ) { return cell.children[0].children[1]; }
  function silhouetteOf( cell ) { return cell.children[0].children[0]; }

  function assertVerdict( cell, image ) {
    expect( verdictOf( cell ).visible, "the verdict overlay should be visible" ).to.equal(true);
    expect( verdictOf( cell ).image, `Expected the verdict to be ${image}` ).to.include(image);
  }

  context('training feedback', function() {
    // Hides abundance and, once assessed, overlays a tick/cross on each taxon
    // from the injected assessor (keyed by sampleTaxonId). A fake assessor
    // marks even ids correct / odd incorrect for a visible mix.
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

    function tenTaxaTray() {
      return new SampleTrayModel(
        Array.from({ length: 10 }, (_, i) => new Taxon({ id: i + 1, taxonId: i + 1, position: i }))
      );
    }

    beforeEach( function() {
      view = makeTestServices({ assessor: mixedAssessor }).View;
      openArgs = { key: keyMock, tray: tenTaxaTray() };
      return openTrainingTray();
    });

    afterEach(cleanupTrainingTray);

    it('hides the abundance badge', function() {
      var endcap = getTaxaIcons( TrainingTray.tray.children[0] );
      expect( abundanceOf( endcap[0] ).visible, "abundance is hidden" ).to.equal(false);
      expect( endcap[0].children[0].visible, "the silhouette still shows" ).to.equal(true);
    });

    it('shows no verdict overlay until the tray is assessed', function() {
      var endcap = getTaxaIcons( TrainingTray.tray.children[0] );
      expect( verdictOf( endcap[0] ).visible ).to.equal(false);
    });

    it('reveals a tick or cross on each taxon once assessed', function() {
      trayVm().assess();
      return assertEventually( function() {
        var endcap = getTaxaIcons( TrainingTray.tray.children[0] );
        // endcap cells map to collection indices [0,1] → sampleTaxonId 1 (odd →
        // cross) and 2 (even → tick).
        assertVerdict( endcap[0], "cross-icon.png" );
        assertVerdict( endcap[1], "tick-icon.png" );
      });
    });

    it('grades the tray when the Assess anchor button is tapped', function() {
      TrainingTray.assessButton.NavButton.fireEvent("click");
      return assertEventually( function() {
        var endcap = getTaxaIcons( TrainingTray.tray.children[0] );
        assertVerdict( endcap[0], "cross-icon.png" );
        assertVerdict( endcap[1], "tick-icon.png" );
      });
    });

    it('returns to the menu when Back is tapped', function(done) {
      actionFiresTopicTest( TrainingTray.backButton.NavButton, 'click', Topics.HOME, () => done() );
    });

    it('clears the feedback when a taxon is re-identified', function() {
      trayVm().assess();
      return assertEventually( function() {
        assertVerdict( getTaxaIcons( TrainingTray.tray.children[0] )[0], "cross-icon.png" );
      }).then( function() {
        return new Promise(function(resolve) {
          updateTrainingTrayOnce(resolve);
          // Mirrors Training.addTaxon's actual re-identify-in-place: remove
          // whatever occupies the slot, then add the new pick at that position
          // (SampleTrayModel has no in-place mutation — a taxon is replaced,
          // not edited).
          var old = openArgs.tray.taxa().find(function (t) { return t.position === 0; });
          openArgs.tray.remove(old);
          openArgs.tray.add( new Taxon({ id: 99, taxonId: 11, position: 0 }) );
        }).then( function() {
          return assertEventually( function() {
            expect( verdictOf( getTaxaIcons( TrainingTray.tray.children[0] )[0] ).visible ).to.equal(false);
          });
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

    function twoTaxaTray() {
      return new SampleTrayModel([
        new Taxon({ id: 1, taxonId: 1, position: 0 }),
        new Taxon({ id: 2, taxonId: 2, position: 1 }),
      ]);
    }

    function openWithAssessor(assessor, noticeDwellMs) {
      view = makeTestServices({ assessor: assessor }).View;
      openArgs = { key: keyMock, tray: twoTaxaTray(), noticeDwellMs: noticeDwellMs };
      return openTrainingTray();
    }

    afterEach(cleanupTrainingTray);

    it('shows the notice when an assessment has an incorrect taxon', function () {
      return openWithAssessor(verdictAssessor("incorrect"), 4000).then(function () {
        trayVm().assess();
        // visible is the bound VM state; opacity > 0.9 confirms the fadeInNotice
        // command actually animated it up (not just left it transparent).
        return waitFor(function () {
          return TrainingTray.incorrectNotice.visible === true
            && TrainingTray.incorrectNotice.opacity > 0.9;
        });
      });
    });

    it('keeps the notice hidden when every taxon is correct', function () {
      return openWithAssessor(verdictAssessor("correct"), 4000).then(function () {
        trayVm().assess();
        expect(TrainingTray.incorrectNotice.visible).to.equal(false);
      });
    });

    it('lets taps through to the taxa underneath (non-modal)', function () {
      return openWithAssessor(verdictAssessor("incorrect"), 4000).then(function () {
        expect(TrainingTray.incorrectNotice.touchEnabled).to.equal(false);
      });
    });

    it('fades the notice away after its dwell', function () {
      // Short dwell so the auto-hide is observable quickly (production dwell is 4s).
      return openWithAssessor(verdictAssessor("incorrect"), 300).then(function () {
        trayVm().assess();
        return waitFor(function () { return TrainingTray.incorrectNotice.visible === true; })
          .then(function () {
            return waitFor(function () { return TrainingTray.incorrectNotice.visible === false; });
          });
      });
    });
  });

  context('training tray (domain aggregate)', function() {
    // The screen threads the training domain aggregate (args.tray), not a
    // survey Alloy taxa collection — proven here by rendering with no
    // args.taxa, and by the tray re-rendering when a taxon is added straight
    // to the aggregate.
    var trainingTray;

    beforeEach(function() {
      trainingTray = new SampleTrayModel([
        new Taxon({ id: 1, taxonId: 1, position: 0 }),
        new Taxon({ id: 2, taxonId: 2, position: 1 }),
      ]);
      view = makeTestServices().View;
      openArgs = { key: keyMock, tray: trainingTray };
      return openTrainingTray();
    });

    afterEach(cleanupTrainingTray);

    it('renders the tray taxa from the domain aggregate, with abundance hidden', function() {
      var endcap = getTaxaIcons( TrainingTray.tray.children[0] );
      expect( endcap ).to.have.lengthOf(2);
      expect( silhouetteOf( endcap[0] ).image ).to.include('/aeshnidae_telephleb_b.png');
      expect( abundanceOf( endcap[0] ).visible, "abundance is hidden" ).to.equal(false);
    });

    it('re-renders when a taxon is added straight to the aggregate', function() {
      return new Promise(function(resolve) {
        updateTrainingTrayOnce(resolve);
        trainingTray.add( new Taxon({ id: 3, taxonId: 3, position: 2 }) );
      }).then(function() {
        return assertEventually(function() {
          var sampleTaxa = getTaxaIcons( TrainingTray.tray.children[1] );
          expect( silhouetteOf( sampleTaxa[0] ).image ).to.include('/anisops_b.png');
        });
      });
    });
  });
});

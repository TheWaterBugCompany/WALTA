require('specs/lib/ti-mocha');

var Alloy = require('alloy');
var TestUtils = require('specs/util/TestUtils');
var MockSpeedbug = require('specs/mocks/MockSpeedbug');
var mocx = require("specs/lib/mocx");

describe( 'SampleTray', function() {

  var SampleTray, SampleTrayWin;

  function openSampleTray(done) {
    SampleTray = Alloy.createController("SampleTray", { speedbugIndex: MockSpeedbug.speedBugIndexMock });
    SampleTrayWin = TestUtils.wrapViewInWindow( SampleTray.getView() );
    SampleTrayWin.addEventListener("open" , function open() {
      SampleTrayWin.removeEventListener("open", open);
      done();
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

  context( 'Rendering and scrolling', function() {

    before(function(done) {
      mocx.createCollection("taxa", [
        { taxonId: "WB1", multiplicity: 2 },
        { taxonId: "WB2", multiplicity: 3 },
        { taxonId: "WB3", multiplicity: 2 },
        { taxonId: "WB4", multiplicity: 1 },
        { taxonId: "WB5", multiplicity: 1 },
        { taxonId: "WB4", multiplicity: 3 },
        { taxonId: "WB1", multiplicity: 1 },
        { taxonId: "WB3", multiplicity: 1 },
        { taxonId: "WB2", multiplicity: 1 },
        { taxonId: "WB2", multiplicity: 2 },
        { taxonId: "WB5", multiplicity: 6 }
      ]);
      openSampleTray(done);
    });

    after(function(done){
      if ( ! TestUtils.isManualTests() )
        cleanupSampleTray(done);
    });


    it.only('should display the correct sample entry for each hole', function(done) {
      Ti.API.info(`SampleTray.getView().getChildren() = ${SampleTray.getView().getChildren()}`);
    });
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

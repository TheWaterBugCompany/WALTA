require("unit-test/lib/ti-mocha");

function addTestFiles(mocha) {
  [ "AnchorBar", 
    "TaxonList",
    "Habitat",
    "KeyNode",
    "KeySearch",
    "LogIn",
    "MediaUtil",
    "MethodSelect",
    "Menu",
    "Register",
    "QuestionController",
    "SampleTray",
    "Sample",
    "Speedbug",
    "Summary",
    "TaxonDetails",
    "SiteDetails",
    "VideoView",
    "ViewUtils",
    "LocationEntry",
    "LeafletMap",
    "MayflyEmergenceMap",
    "MayflyMusterSelect",
    "Gallery",
    "PhotoSelect",
    "EditTaxon",
  ].forEach( (f) =>  {
    let specPath = `unit-test/${f}_spec`;
    require( specPath );
  });
}

addTestFiles(mocha);

// Create a blank window: for some reason closing the last window hangs
// the test suite.
var backgroundWindow = Ti.UI.createWindow( { backgroundColor: "black" } );
backgroundWindow.addEventListener('open' , function() {
  /*function doTest( i ) {
    console.info(`Stress test run ${i} ==============================================`)
    if ( i > 0 ) {
      let mocha = new Mocha();
      addTestFiles(mocha);
      mocha.run( () => doTest( i-1 ) );
    }
  }
  doTest(1); */
  mocha.run();
} );
backgroundWindow.open();

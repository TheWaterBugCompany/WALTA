require("unit-test/lib/ti-mocha");

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



// Create a blank window: for some reason closing the last window hangs 
// the test suite.
var backgroundWindow = Ti.UI.createWindow( { backgroundColor: "black" } );
backgroundWindow.addEventListener('open' , function() {
  mocha.run();
} );
backgroundWindow.open();

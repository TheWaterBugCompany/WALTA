var Mocha = require("unit-test/lib/ti-mocha"); 
var { setManualTests, isManualTests } = require('unit-test/util/TestUtils');

function runTests() {
  let mocha = new Mocha({
    ui: 'bdd',
    reporter: 'ti-spec'
  });
  if ( isManualTests() ) {
    mocha.timeout(0);
  }
  return new Promise( function(resolve, reject) {
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
    ].forEach( (f) => {
      let specPath = `unit-test/${f}_spec`;
      if ( __remove_module_from_preview_cache ) {
        __remove_module_from_preview_cache(specPath);
      }
      mocha.addFile(specPath);
    });
    return mocha.run(resolve);
  });
}

// useful for testing memory leaks
infinteLoopMode = __hacked_live_view && false;

// freeze each test to allow manual inspection - on Android use the menu option "Continue" to continue test.
setManualTests( __hacked_live_view && false );

// Create a blank window: for some reason closing the last window hangs 
// the test suite.
var backgroundWindow = Ti.UI.createWindow( { backgroundColor: "black" } );
backgroundWindow.addEventListener('open' , function() {
    let i = 0;
   function forever(first, fn) {
      console.log(`\n\n${++i} ===========================================\n`)
      return first.then(fn).then( () => forever(Promise.resolve(),fn)); 
   }
   // run forever to allow memory leak detection
   if ( infinteLoopMode ) 
      forever( Promise.resolve(), runTests );
   else
      runTests();
} );
backgroundWindow.open();

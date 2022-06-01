var Mocha = require("unit-test/lib/ti-mocha"); 
var { setManualTests, isManualTests } = require('unit-test/util/TestUtils');

function runTests() {
  let mocha = new Mocha({
    ui: 'bdd',
    reporter: 'ti-spec'
  });
  if ( isManualTests() ) {
    mocha.timeout(0);
  } else {
    mocha.timeout(10000); // for slow devices
  }
  return new Promise( function(resolve, reject) {
    [ 
      "VideoView",
      "AnchorBar", 
      "TaxonList",
      "Habitat",
      "KeyNode",
      "KeySearch",
      "LogIn",
      "MediaUtil",
      "MethodSelect",
      "Menu",
      "Notes",
      "Register",
      "QuestionController",
      "SampleTray",
      "Sample",
      "Speedbug",
      "Summary",
      "TaxonDetails",
      "SiteDetails",
      "ViewUtils",
      //"LeafletMap",
      "MayflyEmergenceMap",
      "MayflyMusterSelect",
      "SampleSync",
      "SampleHistory",
      "Gallery",
      "PhotoSelect",
      "EditTaxon",
      "NavButton",
      "GoBackButton",
      "GoForwardButton",
      "LocationEntry",
      "Main",
      "Navigation",
      //"Database"  - needs to run last, migrations are run in all database using test anyway
    ].forEach( (f) => {
      let specPath = `unit-test/${f}_spec`;
      try { __remove_module_from_preview_cache(specPath);} catch(e) {}
      mocha.addFile(specPath);
    });
    return mocha.run(resolve);
  });
}

// useful for testing memory leaks
var infinteLoopMode = false; 

// freeze each test to allow manual inspection - on Android use the menu option "Continue" to continue test.
setManualTests( true );

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

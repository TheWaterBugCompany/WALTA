var Mocha = require("spec/lib/ti-mocha");
var { setManualTests, isManualTests } = require('spec/util/TestUtils');

var SPEC_FILES = [
  "About",
  "Help",
  "CloseButton",
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
];

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
    SPEC_FILES.forEach( (f) => {
      let specPath = `spec/${f}_spec`;
      try { __remove_module_from_preview_cache(specPath);} catch(e) {}
      mocha.addFile(specPath);
    });
    return mocha.run(resolve);
  });
}

// useful for testing memory leaks
var infinteLoopMode = false;

// freeze each test to allow manual inspection - on Android use the menu option "Continue" to continue test.
setManualTests( false );

// Prevent the screen from locking during test runs — if the device auto-locks
// iOS classifies the app as background and the watchdog kills it within 10s.
Ti.App.idleTimerDisabled = true;

console.log("[CI-DEBUG] Creating background window...");
var backgroundWindow = Ti.UI.createWindow( { backgroundColor: "black" } );
console.log("[CI-DEBUG] Adding open event listener...");
backgroundWindow.addEventListener('open' , function() {
    console.log("[CI-DEBUG] Window opened, starting tests...");
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
console.log("[CI-DEBUG] Calling backgroundWindow.open()...");
backgroundWindow.open();
console.log("[CI-DEBUG] backgroundWindow.open() returned");

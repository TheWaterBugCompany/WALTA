var Mocha = require("spec/lib/ti-mocha");
var { setManualTests, isManualTests } = require('spec/util/TestUtils');

// Runtime test config passed via launcher args:
//   Android: intent extras (--es test_grep "…" --ez test_manual true)
//   iOS:     NSUserDefaults-style argv (-test_grep … -test_manual true),
//            which iOS auto-merges into NSUserDefaults — read via
//            Ti.App.Properties (backed by NSUserDefaults on iOS).
// See build-utils/{AndroidLauncher,IosSimulatorLauncher}.js for the
// producer side; Gruntfile.js `launch` task maps --grep / --manual
// into the launchArgs payload.
function readTestConfig() {
  try {
    if (Ti.Platform.osname === 'android') {
      var activity = Ti.Android.currentActivity;
      var intent = activity && activity.intent;
      if (!intent) return {};
      return {
        grep: intent.getStringExtra("test_grep") || null,
        manual: intent.getBooleanExtra("test_manual", false),
      };
    }
    // iOS: argv `-test_grep About -test_manual true` is merged into
    // NSUserDefaults on launch; Ti.App.Properties is our bridge to it.
    // Values come back as strings regardless of the original type.
    var grep = Ti.App.Properties.getString("test_grep") || null;
    var manualRaw = Ti.App.Properties.getString("test_manual");
    var manual = manualRaw === "true" || manualRaw === "1";
    return { grep: grep, manual: manual };
  } catch (e) {
    Ti.API.warn("Could not read launch args for test config: " + e);
    return {};
  }
}

var TEST_CONFIG = readTestConfig();

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
  "IosSurveyDatePicker",
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
  "SyncFeedback",
  "UploadBadge",
  "SampleEditMenu",
  "SampleHistory",
  "Gallery",
  "PhotoSelect",
  "PhotoPaths",
  "EditTaxon",
  "NavButton",
  "GoBackButton",
  "GoForwardButton",
  "LocationEntry",
  "Main",
  "Navigation",
  "util/repository/LogRepository",
  "DiagnosticsBundle",
  "AppReset",
  //"Database"  - needs to run last, migrations are run in all database using test anyway
];

function runTests() {
  let mocha = new Mocha({
    ui: 'bdd',
    reporter: 'ti-spec'
  });
  if ( TEST_CONFIG.grep ) {
    Ti.API.info(`Running only tests matching /${TEST_CONFIG.grep}/`);
    mocha.grep(TEST_CONFIG.grep);
  }
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
// Can be flipped at runtime via `--manual` on `grunt unit-test` (no rebuild needed).
setManualTests( TEST_CONFIG.manual === true );

// Prevent the screen from locking during test runs — if the device auto-locks
// iOS classifies the app as background and the watchdog kills it within 10s.
Ti.App.idleTimerDisabled = true;

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

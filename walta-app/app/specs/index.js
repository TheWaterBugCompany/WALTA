require("specs/lib/ti-mocha");

require("specs/AnchorBar_spec");
require("specs/BrowseView_spec");
require("specs/KeyNode_spec");
require("specs/KeySearch_spec");
require("specs/LogIn_spec")
require("specs/MediaUtil_spec");
require("specs/MethodSelect_spec");
require("specs/Menu_spec");
require("specs/Register_spec");
require("specs/PhotoView_spec");
require("specs/QuestionView_spec");
require("specs/SampleTray_spec");
require("specs/SpeedbugView_spec");
require("specs/TaxonDetails_spec");
require("specs/VideoView_spec");
require("specs/Sample_spec");

// Create a blank window: for some reason closing the last window hangs
// the test suite.
var backgroundWindow = Ti.UI.createWindow( { backgroundColor: "black" } );
backgroundWindow.addEventListener('open' , function() {
  mocha.run();
} );
backgroundWindow.open();

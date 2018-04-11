require("specs/lib/ti-mocha");
require("specs/AnchorBar_spec");
require("specs/AppWindow_spec");
require("specs/BrowseView_spec");
require("specs/Key_spec");
require("specs/KeyNode_spec");
require("specs/MediaUtil_spec");
require("specs/MenuView_spec");
require("specs/PhotoView_spec");
require("specs/Question_spec");
require("specs/QuestionView_spec");
require("specs/SampleTray_spec");
require("specs/SpeedbugView_spec");
require("specs/Taxon_spec");
require("specs/TaxonView_spec");
require("specs/TopLevelWindow_spec");
require("specs/VideoView_spec");
require("specs/Sample_spec");

// Create a blank window: for some reason closing the last window hangs
// the test suite.
var backgroundWindow = Ti.UI.createWindow( { backgroundColor: "black" } );
backgroundWindow.addEventListener('open' , function() {
  mocha.run();
} );
backgroundWindow.open();

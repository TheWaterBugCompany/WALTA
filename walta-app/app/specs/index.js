require("specs/lib/ti-mocha");

require("specs/AnchorBar_spec");
require("specs/TaxonList_spec");
require("specs/EditTaxon_spec");
require("specs/Habitat_spec");
require("specs/KeyNode_spec");
require("specs/KeySearch_spec");
require("specs/LogIn_spec")
require("specs/MediaUtil_spec");
require("specs/MethodSelect_spec");
require("specs/Menu_spec");
require("specs/Register_spec");
require("specs/PhotoSelect_spec");
require("specs/QuestionController_spec");
require("specs/SampleTray_spec");
require("specs/Sample_spec");
require("specs/Speedbug_spec");
require("specs/Summary_spec");
require("specs/TaxonDetails_spec");
require("specs/SiteDetails_spec");
require("specs/VideoView_spec");
require("specs/ViewUtils_spec");
require("specs/LocationEntry_spec");
require("specs/LeafletMap_spec");
require("specs/MayflyEmergenceMap_spec");
require("specs/MayflyMusterSelect_spec");
require("specs/Gallery_spec");


// Create a blank window: for some reason closing the last window hangs
// the test suite.
var backgroundWindow = Ti.UI.createWindow( { backgroundColor: "black" } );
backgroundWindow.addEventListener('open' , function() {
  mocha.run();
} );
backgroundWindow.open();

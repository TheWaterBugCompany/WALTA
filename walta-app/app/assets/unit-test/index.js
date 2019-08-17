require("unit-test/lib/ti-mocha");

require("unit-test/AnchorBar_spec");
require("unit-test/TaxonList_spec");
require("unit-test/EditTaxon_spec");
require("unit-test/Habitat_spec");
require("unit-test/KeyNode_spec");
require("unit-test/KeySearch_spec");
require("unit-test/LogIn_spec")
require("unit-test/MediaUtil_spec");
require("unit-test/MethodSelect_spec");
require("unit-test/Menu_spec");
require("unit-test/Register_spec");
require("unit-test/PhotoSelect_spec");
require("unit-test/QuestionController_spec");
require("unit-test/SampleTray_spec");
require("unit-test/Sample_spec");
require("unit-test/Speedbug_spec");
require("unit-test/Summary_spec");
require("unit-test/TaxonDetails_spec");
require("unit-test/SiteDetails_spec");
require("unit-test/VideoView_spec");
require("unit-test/ViewUtils_spec");
require("unit-test/LocationEntry_spec");
require("unit-test/LeafletMap_spec");
require("unit-test/MayflyEmergenceMap_spec");
require("unit-test/MayflyMusterSelect_spec");
require("unit-test/Gallery_spec");


// Create a blank window: for some reason closing the last window hangs
// the test suite.
var backgroundWindow = Ti.UI.createWindow( { backgroundColor: "black" } );
backgroundWindow.addEventListener('open' , function() {
  mocha.run();
} );
backgroundWindow.open();

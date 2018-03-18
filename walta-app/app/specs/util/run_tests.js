var manualTests = true;
var TestUtils = require("specs/util/TestUtils");
TestUtils.setManualTests(manualTests);
require("specs/lib/ti-mocha");

//require("specs/MenuView_spec");
require("specs/SampleTray_spec");

mocha.run();

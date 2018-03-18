var manualTests = true;
var TestUtils = require("specs/util/TestUtils");

TestUtils.setManualTests(manualTests);


require("specs/lib/ti-mocha");
require("specs/SampleTray_spec");


var runTests = function(e) {
	mocha.run();
};

if (manualTests) {
	var win = Ti.UI.createWindow({
		title: 'WALTA Test Harness',
		exitOnClose: true,
		fullscreen: true,
		navBarHidden: true
	});
	var btn = Ti.UI.createButton({
		title: 'Run Tests'
	});
	btn.addEventListener('click',runTests);
	win.add(btn);
	win.open();
} else {
	runTests();
}

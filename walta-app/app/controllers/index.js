
var tests = false // Set to true to run the test harness
var manualTests = false;
if ( tests ) {
  var TestUtils = require('util/TestUtils');
	TestUtils.setManualTests(manualTests);

	var tests = [
		 "specs/TaxonView_spec",
		 "specs/TopLevelWindow_spec",
		 "specs/AnchorBar_spec",
		 "specs/AppWindow_spec",
		// "specs/BrowseView_spec", relies on XML
		 "specs/Key_spec",
		// "specs/KeyLoaderXml_spec", only runs in nodejs environment now
		 "specs/KeyNode_spec",
		 "specs/KeyView_spec",
		 "specs/MediaUtil_spec",
		 "specs/MenuView_spec",
		 "specs/PhotoView_spec",
		 "specs/Question_spec",
		 "specs/QuestionView_spec",
		// "specs/SpeedbugView_spec", relies on XML
		 "specs/Taxon_spec",
		 //"specs/VideoView_spec", crashes App ??
		// "specs/XmlUtil_spec" relies on XML
		];

	var tijasmine = require("specs/lib/tijasmine");
	var tijasmineConsole  = require("specs/lib/tijasmine-console");
	var reporter = new tijasmineConsole.ConsoleReporter();

	tijasmine.addReporter( reporter );

	var runTests = function(e) {
		// Fire the test suite
		tijasmine.addSpecModules( tests );
		tijasmine.execute();
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
}

if (!manualTests) {
	var AppWindow = require('control/AppWindow');
	AppWindow.createAppWindow( 'walta' ).start();

}

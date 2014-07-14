/*
 * Bootstrap the application 
 */

var tests = false; // Set to true to run the test harness
if ( ! tests ) {
	var AppWindow = require('control/AppWindow');
    AppWindow.createAppWindow( 'walta' ).start();
} else {
	
	var TestUtils = require('util/TestUtils');
	TestUtils.setManualTests(true);
	
	var tests = [  
		 //"spec/TaxonView_spec", 
		 //"spec/TopLevelWindow_spec",
		 //"spec/AnchorBar_spec", 
		 //"spec/AppWindow_spec", 
		 //"spec/BrowseView_spec", 
		 "spec/Key_spec", 
		 "spec/KeyLoaderXml_spec", 
		 //"spec/KeyNode_spec", 
		 //"spec/KeyView_spec", 
		 //"spec/MediaUtil_spec", 
		 //"spec/MenuView_spec", 
		 //"spec/PhotoView_spec", 
		 //"spec/Question_spec", 
		 //"spec/QuestionView_spec", 
		 //"spec/SpeedbugView_spec", 
		 //"spec/Taxon_spec",
		 //"spec/VideoView_spec",
		 "spec/XmlUtil_spec" 
		];
		
	var tijasmine = require("spec/lib/tijasmine");
	var tijasmineConsole  = require("spec/lib/tijasmine-console");
	var reporter = new tijasmineConsole.ConsoleReporter();
	
	tijasmine.addReporter( reporter );

	var runTests = function(e) {
		// Fire the test suite
		tijasmine.addSpecModules( tests );
		tijasmine.execute();
	};
	
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
	
}

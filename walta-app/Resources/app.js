/*
 * Bootstrap the application 
 */

var tests = false;
if ( ! tests ) {
	var AppWindow = require('control/AppWindow');
    AppWindow.createAppWindow( 'walta' ).start();
} else {
	
	
	
	var tests = [  
		'spec/TopLevelWindow_spec'
		//"spec/AnchorBar_spec", 
		//"spec/AppWindow_spec" 
		// "spec/BrowseView_spec", 
		// "spec/Key_spec", 
		// "spec/KeyLoaderXml_spec", 
		// "spec/KeyNode_spec", 
		// "spec/KeyView_spec", 
		// "spec/MediaUtil_spec", 
		// "spec/MenuView_spec", 
		// "spec/PhotoView_spec", 
		// "spec/Question_spec", 
		// "spec/QuestionView_spec", 
		// "spec/SpeedbugView_spec", 
		// "spec/Taxon_spec", 
		// "spec/TaxonView_spec", 
		// "spec/VideoView_spec",
		// "spec/XmlUtil_spec" 
		];
		
	var tijasmine = require("spec/lib/tijasmine");
	var tijasmineConsole  = require("spec/lib/tijasmine-console");
	var reporter = new tijasmineConsole.ConsoleReporter();
	tijasmine.addSpecModules( tests );
	tijasmine.addReporter( reporter );

	var runTests = function(e) {
		// Fire the test suite
		tijasmine.execute();
	};
	
	var win = Ti.UI.createWindow({
		title: 'WALTA Test Harness',
		exitOnClose: true,
		fullscreen: true
	});
	var btn = Ti.UI.createButton({
		title: 'Run Tests'
	});
	btn.addEventListener('click',runTests);
	win.add(btn);
	win.open();
	
}

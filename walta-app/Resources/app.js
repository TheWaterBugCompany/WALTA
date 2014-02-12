/*
 * Bootstrap the application 
 */

var tests = false;
if ( ! tests ) {
	var AppWindow = require('control/AppWindow');
	var keyPath;

	keyPath = Ti.Filesystem.resourcesDirectory + "taxonomy/walta/";
	if ( Ti.Platform.osname === 'android' ) {
			keyPath = "file:///android_asset/Resources/taxonomy/walta/"; // WTF works on android	
	}
	var app = AppWindow.createAppWindow( keyPath );
	app.start();
} else {
	// Fire the test suite
	var tijasmine = require("spec/lib/tijasmine");
	var tijasmineConsole  = require("spec/lib/tijasmine-console");
	var reporter = new tijasmineConsole.ConsoleReporter();
	tijasmine.addSpecModules(
			// "spec/AnchorBar_spec",
			// "spec/AppWindow_spec",
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
			//"spec/TaxonView_spec",
			 "spec/VideoView_spec"
			// "spec/XmlUtil_spec"
		);
	tijasmine.addReporter(reporter);
	tijasmine.execute();
}

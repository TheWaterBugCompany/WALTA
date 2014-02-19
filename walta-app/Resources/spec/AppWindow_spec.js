require("spec/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');
var AppWindow = require('control/AppWindow');

var Topics = require('ui/Topics');

describe('AppWindow', function() {
	var app;
	
	function closeWindow() {
		if ( app ) {
			TestUtils.ifNotManual( function() {
				var win = app.getCurrentWindow();
				if ( win && win.window ) {
					app.close();
				} else {
					waitsFor( function() { return win.window; }, "waiting for window to open", 7500); 
					app.close();
				}
			});
		} 
	}
	
	beforeEach( function() {
		runs( function() {
			app = AppWindow.createAppWindow( 'simpleKey1', Ti.Filesystem.resourcesDirectory + 'spec/resources/' );
			app.start();
		});
		
		waitsFor( function() {
			return app.getCurrentWindow();
		}, "waiting for app to start", 750); 
	});
	
	

	it('should open the main window after start() is called', function() {
		runs( function() {
			expect( app.getCurrentWindow().name ).toEqual('home');
			closeWindow();
		});
	});
	
	it('should open the decision window when key search is started', function(){
		TestUtils.actionFiresTopicTest( 
			app.getCurrentWindow().uiObj._views.keysearch, 'click', Topics.KEYSEARCH 
		);
		runs( function() {
			expect( app.getCurrentWindow().name ).toEqual('decision');
			closeWindow();
		} );
	});
	
	// TODO: Check details of decision screen
	// TODO: Test question selection
	// TODO: Test back
	// TODO: Test navigation to Taxon node
	// TODO: Test back from Taxon node
	

});
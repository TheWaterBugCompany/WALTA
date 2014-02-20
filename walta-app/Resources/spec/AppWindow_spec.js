require("spec/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');
var AppWindow = require('control/AppWindow');

var Topics = require('ui/Topics');

describe('AppWindow', function() {
	var app;
	
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
			TestUtils.closeWindow( app.getCurrentWindow().window );
		});
	});
	
	it('should open the decision window when key search is started', function(){
		TestUtils.actionFiresTopicTest( 
			app.getCurrentWindow().uiObj._views.keysearch, 'click', Topics.KEYSEARCH 
		);
		runs( function() {
			expect( app.getCurrentWindow().name ).toEqual('decision');
			TestUtils.closeWindow( app.getCurrentWindow().window );
		} );
	});
	
	// TODO: Check details of decision screen
	// TODO: Test question selection
	// TODO: Test back
	// TODO: Test navigation to Taxon node
	// TODO: Test back from Taxon node
	

});
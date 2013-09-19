var TestUtils = require('util/TestUtils');
var AppWindow = require('AppWindow');

var Topics = require('Topics');

describe('AppWindow', function() {
	var app;

	beforeEach( function() {
		runs( function() {
			app = AppWindow.createAppWindow( 'spec/resources/simpleKey1' );
			app.start();
		});
		
		waitsFor( function() {
			return app.getCurrentWindow();
		}, "waiting for app to start", 750 ); 
	});
	
	afterEach( function() {
			TestUtils.ifNotManual(function() { app.close(); });
	});

	it('should open the main window after start() is called', function() {
		runs( function() {
			expect( app.getCurrentWindow().name ).toEqual('home');
		});
	});
	
	it('should open the decision window when key search is started', function(){
		TestUtils.actionFiresTopicTest( 
			app.getCurrentWindow().uiObj._views.keysearch, 'click', Topics.KEYSEARCH 
		);
		runs( function() {
			expect( app.getCurrentWindow().name ).toEqual('decision');
		} );
	});
	
	// TODO: Check details of decision screen
	// TODO: Test question selection
	// TODO: Test back
	// TODO: Test navigation to Taxon node
	// TODO: Test back from Taxon node
	

});
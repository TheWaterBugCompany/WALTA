var PubSub = require('lib/pubsub');
var AnchorBar = require('ui/AnchorBar');
		
describe('AnchorBar', function() {
	var acb, win;
	
	beforeEach(function() {
		acb = AnchorBar.createAnchorBar();
		win = Ti.UI.createWindow( { backgroundColor: 'white', orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] } );
		win.add(acb.view);
	});
	
	afterEach(function() {
		win.close();
	});

	it('should display an anchor bar at the top of the screen', function() {
		var openCalled = false;		
		runs(function() {		
			win.addEventListener( 'open', function(e) { openCalled = true; } );
			win.open();
		});
		
		waitsFor(function() {
			return openCalled;
		}, "Window to open", 750 );
		
		runs(function() {
			expect( openCalled, true );
			// can we check things like actual height and width here??
		});
		
	});
	
	it('should fire the HOME event when the home button is clicked', function() {
		var evtFires = false;	
			
		runs(function() {	
			PubSub.subscribe( AnchorBar.topics.HOME, function() { evtFires = true; } );	
			win.open();
			acb._views.home.fireEvent('click');
		});
		
		waitsFor(function() {
			return evtFires;
		}, "HOME topic to be called", 750 );
		
		runs(function() {
			expect( evtFires, true );
		});
		
	});
	
	it('should fire the SETTINGS event when the settings button is clicked', function() {
		var evtFires = false;	
			
		runs(function() {	
			PubSub.subscribe( AnchorBar.topics.SETTINGS, function() { evtFires = true; } );	
			win.open();
			acb._views.settings.fireEvent('click');
		});
		
		waitsFor(function() {
			return evtFires;
		}, "SETTINGS topic to be called", 750 );
		
		runs(function() {
			expect( evtFires, true );
		});
		
	});
	
	it('should fire the INFO event when the settings button is clicked', function() {
		var evtFires = false;	
			
		runs(function() {	
			PubSub.subscribe( AnchorBar.topics.INFO, function() { evtFires = true; } );	
			win.open();
			acb._views.info.fireEvent('click');
		});
		
		waitsFor(function() {
			return evtFires;
		}, "INFO topic to be called", 750 );
		
		runs(function() {
			expect( evtFires, true );
		});
		
	});

});
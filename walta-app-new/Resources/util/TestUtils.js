/*
 * Some utility functions to help running tests.
 * 
 */
var PubSub = require('lib/pubsub');
var meld = require('lib/meld');

	TestUtils = {
		
		isManualTests: function() { return false; },
		
		wrapViewInWindow: function( view ) {
			var win = Ti.UI.createWindow( { backgroundColor: 'white' } );
			win.add( view );
			return win;
		},
		
		windowOpenTest: function( win ) {
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
			});
		},
		
		actionFiresEventTest: function( actionObj, actionEvtName,  evtObj, evtName ) {
			var evtFires = false;	
			
			runs(function() {	
				meld.on( evtObj, evtName, function(e) { evtFires = true; } );
				actionObj.fireEvent(actionEvtName);
			});
			
			waitsFor(function() {
				return evtFires;
			}, evtName + " to be called", 750 );
			
			runs(function() {
				expect( evtFires, true );
			});
		},
		
		actionFiresTopicTest: function( actionObj, actionEvtName,  topicName ) {
			var evtFires = false;	
			runs(function() {
				PubSub.subscribe( topicName, function(e) { evtFires = true; } );
				actionObj.fireEvent(actionEvtName);
			});
			
			waitsFor(function() {
				return evtFires;
			}, topicName + " to be called", 750 );
			
			runs(function() {
				expect( evtFires, true );
			});
		},
		
		closeWindow: function( win ) {
			runs(function() {
				if ( ! TestUtils.isManualTests() ) {
					win.close();
				}
		
			});
		}
	};

	
	
 exports = TestUtils;
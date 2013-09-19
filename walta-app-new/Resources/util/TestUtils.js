/*
 * Some utility functions to help running tests.
 * 
 */
var PubSub = require('lib/pubsub');
var meld = require('lib/meld');

var manualTests = false;

function setManualTests( bl ) { manualTests = b; }

function isManualTests() { return manualTests; }
		
function waitForAsyncCallback( regEvent, timeout ) {
	if ( ! timeout ) timeout = 750;
	
	var ctx = { fired: false };	// Since JS is pass by value we need an object to pass the fired by reference
	runs(function() { regEvent(ctx); });
	
	waitsFor(function() {
		return ctx.fired;
	}, "waiting for callback", timeout );
	
	runs(function() {
		expect( ctx.fired, true );
	});
}
		
function waitForDomEvent( obj, evtName, fireEvent, timeout ) {
	waitForAsyncCallback( function(ctx) { 
		obj.addEventListener( evtName, function() { ctx.fired = true; } );
		fireEvent(); 
	}, timeout ); 
}
		
function waitForMeldEvent( obj, evtName, fireEvent, timeout ) {
	waitForAsyncCallback( function(ctx) { 
		meld.on( obj, evtName, function() { ctx.fired = true; } );
		fireEvent(); 
	}, timeout ); 
}
		
function waitForTopic( topicName, fireEvent, timeout, result ) {
	waitForAsyncCallback( function(ctx) { 
		PubSub.subscribe( topicName, function( msg, data ) { 
			ctx.fired = true; 
			result.msg = msg;
			result.data = data;
		} );
		fireEvent(); 
	}, timeout ); 
}
		
function wrapViewInWindow( view ) {
	var win = Ti.UI.createWindow( { backgroundColor: 'white' } );
	win.add( view );
	return win;
}
		
function windowOpenTest( win, timeout ) {
	waitForDomEvent( win, 'open', function(){ win.open(); }, timeout ); 
}
		
function actionFiresEventTest( actionObj, actionEvtName,  evtObj, evtName, timeout ) {
	waitForMeldEvent( evtObj, evtName, function() {
		actionObj.fireEvent( actionEvtName );
	}, timeout);
}
		
function actionFiresTopicTest( actionObj, actionEvtName, topicName, timeout ) {
	var result = {};
	waitForTopic( topicName, function() {
		actionObj.fireEvent( actionEvtName );
	}, timeout, result);
	return result;
}
		
function ifNotManual( cb ) {
	runs( function() {
		if ( ! isManualTests() ) {
			cb();
		}
	});
}
		
function closeWindow( win ) {
	ifNotManual(function() {
			win.close();
	});
}
exports.closeWindow = closeWindow;
exports.ifNotManual = ifNotManual;
exports.actionFiresTopicTest = actionFiresTopicTest;
exports.actionFiresEventTest = actionFiresEventTest;
exports.windowOpenTest = windowOpenTest;
exports.wrapViewInWindow = wrapViewInWindow;
exports.waitForTopic = waitForTopic;
exports.waitForMeldEvent = waitForMeldEvent;
exports.waitForDomEvent = waitForDomEvent;
exports.waitForAsyncCallback = waitForAsyncCallback;
exports.isManualTests = isManualTests;
exports.setManualTests = setManualTests;
exports.waitForAsyncCallback = waitForAsyncCallback;
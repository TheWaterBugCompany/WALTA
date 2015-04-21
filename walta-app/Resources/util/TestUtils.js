/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * Some utility functions to help running tests.
 * 
 */
var PubSub = require('lib/pubsub');
var meld = require('lib/meld');

var manualTests = false;

function setManualTests( b ) { manualTests = b; }

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
	if ( ! timeout ) timeout = 3000;
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
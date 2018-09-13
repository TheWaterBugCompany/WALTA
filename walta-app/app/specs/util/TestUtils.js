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

var meld = require('lib/meld');

var Topics = require('ui/Topics');

function setManualTests( b ) { Alloy.CFG.stopAfterEachTest = b; }

function isManualTests() { return Alloy.CFG.stopAfterEachTest; }

function waitForDomEvent( obj, evtName, fireEvent, done ) {
		obj.addEventListener( evtName, function() { done() } );
		fireEvent();
}

function waitForMeldEvent( obj, evtName, fireEvent, done ) {
		meld.on( obj, evtName, function() { done() } );
		fireEvent();
}

function waitForTopic( topicName, fireEvent, done, result ) {
		Topics.subscribe( topicName, function( data ) {
			result.data = data;
			done();
		} );
		fireEvent();
}

function wrapViewInWindow( view ) {
	var win = Ti.UI.createWindow( { backgroundColor: 'white' } );
	win.add( view );
	return win;
}

function windowOpenTest( win, done ) {
	if ( done ) {
		win.addEventListener('open' , function open() {
			win.removeEventListener('open', open);
			done();
		} );
	}
	win.open();
}

function waitForBrowserEvent( obj, setupPromise, eventName ) {
	return function(...args) {
		return new Promise( (resolve, reject) => {
			obj.addEventListener(eventName, function event() {
				obj.removeEventListener(eventName,event);
				resolve(args);
			});
			return setupPromise;
		});
	};
}


function waitForEvent( obj, setupPromise, eventName ) {
	return function(...args) {
		return new Promise( (resolve, reject) => {
			obj.on(eventName, function event() {
				obj.off(eventName,event);
					resolve(args);
			});
			return setupPromise;
		});
	};
}

function waitForTick( timeout ) {
	return function(...args) {
		return new Promise( (resolve, reject) => {
			setTimeout( function() {
					resolve(args);
			}, timeout);
		});
	};
}

function actionFiresEventTest( actionObj, actionEvtName,  evtObj, evtName, done ) {
	waitForMeldEvent( evtObj, evtName, function() {
		actionObj.fireEvent( actionEvtName );
	}, done);
}

function actionFiresTopicTest( actionObj, actionEvtName, topicName, done ) {
	var result = {};
	waitForTopic( topicName, function() {
		actionObj.fireEvent( actionEvtName );
	}, done, result);
	return result;
}

function ifNotManual( cbTrue, cbFalse ) {
	if ( ! isManualTests() ) {
		if ( cbTrue ) {
			cbTrue();
		}
	} else {
		if ( cbFalse ) {
			cbFalse();
		}
	}
}

function closeWindow( win, done ) {
	ifNotManual(function() {
		win.addEventListener( "close", function e() {
			win.removeEventListener( "close", e );
			if ( done )
				done();
		} );
		win.close();
	}, done);
}

function forceCloseWindow( win, done ) {
	win.addEventListener( "close", function e() {
		win.removeEventListener( "close", e );
		if ( done )
			done();
	} );
	win.close();
}

function checkTestResult( done, f ) {
	try {
	  f();
	  done();
	} catch( e ) {
	  done( e );
	}
  }

function controllerOpenTest( ctl, done ) {
	if ( done ) {
		ctl.getView().addEventListener('open' , function open() {
			ctl.getView().removeEventListener('open', open);
			done();
		} );
	}
	ctl.open();
}

exports.forceCloseWindow = forceCloseWindow;
exports.controllerOpenTest = controllerOpenTest;
exports.checkTestResult = checkTestResult;
exports.waitForBrowserEvent = waitForBrowserEvent;
exports.waitForTick = waitForTick;
exports.closeWindow = closeWindow;
exports.ifNotManual = ifNotManual;
exports.waitForEvent = waitForEvent;
exports.actionFiresTopicTest = actionFiresTopicTest;
exports.actionFiresEventTest = actionFiresEventTest;
exports.windowOpenTest = windowOpenTest;
exports.wrapViewInWindow = wrapViewInWindow;
exports.waitForTopic = waitForTopic;
exports.waitForMeldEvent = waitForMeldEvent;
exports.waitForDomEvent = waitForDomEvent;
exports.isManualTests = isManualTests;
exports.setManualTests = setManualTests;

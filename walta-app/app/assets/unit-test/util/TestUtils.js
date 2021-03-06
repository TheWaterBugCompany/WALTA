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

var manualTests = false;
function setManualTests( b ) { manualTests = b; }
function isManualTests() { return manualTests; }

function waitFor(predicate) {
	return new Promise( (resolve) => {
		function checkCondition() {
			if ( predicate() ) {
				resolve();
			} else {
				setTimeout( checkCondition, 50 );
			}
		}
		checkCondition()
	})
}


// TODO: Convert to Promise based API
function waitForDomEvent( obj, evtName, fireEvent, done ) {
		obj.addEventListener( evtName, function() { done() } );
		fireEvent();
}

function waitForMeldEvent( obj, evtName, fireEvent, done ) {
		meld.on( obj, evtName, function() { done() } );
		fireEvent();
}

function waitForBackboneEvent( obj, evtName, fireEvent, done ) {
	obj.on( evtName, function() { done() } );
	fireEvent();
}


function waitForTopic( topicName, fireEvent, done, result ) {
		Topics.subscribe( topicName, function cb( data ) {
			result.data = data;
			Topics.unsubscribe(topicName, cb);
			done(data);
		} );
		fireEvent();
}
// END TODO: convert to promises
function wrapViewInWindow( view ) {
	var win = Ti.UI.createWindow( { backgroundColor: 'white', width: Ti.UI.FILL, height: Ti.UI.FILL } );
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
	waitForBackboneEvent( evtObj, evtName, function() {
		actionObj.fireEvent( actionEvtName );
	}, done);
}

function actionFiresTopicTest( actionObj, actionEvtName, topicName, done ) {
	if ( done ) {
		return actionFiresTopicTestCallback( actionObj, actionEvtName, topicName, done );
	} else {
		return new Promise( resolve => actionFiresTopicTestCallback( actionObj, actionEvtName, topicName, resolve ));
	}
}

function actionFiresTopicTestCallback( actionObj, actionEvtName, topicName, done ) {
	var result = {};
	waitForTopic( topicName, function() {
		actionObj.fireEvent( actionEvtName, { x:0, y:0 } );
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
	win.addEventListener( "close", function handler() {
		win.removeEventListener( "close", handler );
		if ( done )
			done();
	} );
	ifNotManual(() => win.close(), function() {
		if ( win.activity ) {
			win.activity.onCreateOptionsMenu = (e) => {
				var menu = e.menu;
				var menuItem = menu.add( { title: "Continue", showAs: Ti.Android.SHOW_AS_ACTION_NEVER });
				menuItem.addEventListener("click", () => win.close() )
			}
		} else {
			var cont = Ti.UI.createButton( { title: "Continue Test" } );
			var toolbar = Ti.UI.createToolbar({ items: [cont], barColor: "transparent", translucent: true, bottom: 0 });
			cont.addEventListener("click", () => win.close() );
			win.add(toolbar);
		}
	});
}

function forceCloseWindow( win, done ) {
	win.addEventListener( "close", function e() {
		win.removeEventListener( "close", e );
		if ( done )
			done();
	} );
	win.close();
}

function checkTestResult( done, f, delay=0 ) {
	setTimeout( function() { try { f(); done(); } catch( e ) { done( e );} }, delay );
} 


/*
	Use the postlayout event to detect when the controller has been 
	renderered - some views will have code also in the postlayout but
	since this event is registered after the control is created the 
	callback should occur last (?!).

	FIXME: 

	Two API's for this because a lot of code still uses the callback
	version. It turns out that using mocha's Promise support provides
	better error reporting when tests fails, so there is a Promise based
	version that returns a promise to facilitate the transition.

	Prefer Promise based for this reason but it's not worth refactoring
	all the tests at this point so we have both options available.

	If a done function is supplied the callback version is used.
*/

function controllerOpenTest( ctl, done) {
	if ( done )
		controllerOpenTestCallback(ctl, done); 
	else
		return new Promise( (resolve) => controllerOpenTestCallback( ctl, resolve) );
}

function controllerOpenTestCallback( ctl, done ) {
	if ( done ) {
		ctl.getView().addEventListener('postlayout' , function open() {
			ctl.getView().removeEventListener('postlayout', open);
			done();
			//setTimeout( done, 5 ); // the window some time to stabilise after rendering
		} );
	}
	ctl.open();
}

function enterText( field, text) {
	field.value  = text;
	field.fireEvent("change", {value: text});
}

function clickButton( button ) {
	button.fireEvent("click");
}

function makeTestPhoto(name) {
	let photo = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, name);
	let mockPhoto = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "/unit-test/resources/site-mock.jpg");

	if ( ! mockPhoto.exists() ) {
		throw new Error(`${mockPhoto.nativePath} doesn't exist!`);
	}
	else {
		if ( photo.exists() ) {
			photo.deleteFile();
		}
		if ( ! mockPhoto.copy(photo.nativePath) ) {
			console.log(`error copying file to: ${photo.nativePath}`);
		} else if ( ! photo.exists() ) {
			console.log(`copying file to: ${photo.nativePath} succeeded but the file still doesn't exist?`);
		}
	}
	
    return photo.nativePath;
}

function removeDatabase(db_name) {
	var db = Ti.Database.open(db_name);
	db.close();
    db.remove();
}

function resetDatabase() {
	// creates database if missing
	var taxa = Alloy.createModel("taxa");
	Alloy.createModel("sample");
	// opens database
	var db = Ti.Database.open(taxa.config.adapter.db_name);
	db.execute("DELETE FROM taxa");
	db.execute("DELETE FROM sample");
	db.close();
	
}

function resetSample() {
	// reset globals
	Alloy.Models.sample = null;
	Alloy.Models.taxa = null;
	Alloy.Collections.sample = null;
	Alloy.Collections.taxa = null;
  
	Alloy.Collections.instance("sample");
	Alloy.Collections.instance("taxa");
  
	Alloy.Models.instance("sample");
	Alloy.Models.instance("taxa");
  
   
  }
  
  function clearDatabase() {
	resetSample();
	var db = Ti.Database.open("samples");
	db.execute("DELETE FROM sample");
	db.execute("DELETE FROM taxa");
	db.close();
  }

exports.resetSample = resetSample;
exports.clearDatabase = clearDatabase;

exports.enterText = enterText;
exports.clickButton = clickButton;
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
exports.makeTestPhoto = makeTestPhoto;
exports.removeDatabase = removeDatabase;
exports.resetDatabase = resetDatabase;
exports.waitFor = waitFor;
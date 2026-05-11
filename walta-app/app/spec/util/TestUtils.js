
/*
 * Some utility functions to help running tests.
 *
 */

var meld = require('lib/meld');

var Topics = require('ui/Topics');

var manualTests = false;
function setManualTests( b ) { manualTests = b; }
function isManualTests() { return manualTests; }

function waitFor(predicate, { timeoutMs = 5000, intervalMs = 50 } = {}) {
	return new Promise( (resolve, reject) => {
		var start = Date.now();
		function checkCondition() {
			try {
				if ( predicate() ) { resolve(); return; }
			} catch (e) { /* let the predicate retry until the deadline */ }
			if ( Date.now() - start >= timeoutMs ) {
				reject(new Error(`waitFor: predicate never became true within ${timeoutMs}ms`));
				return;
			}
			setTimeout( checkCondition, intervalMs );
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
	if ( done )
		waitForBackboneEventCallback(obj, evtName, fireEvent, done); 
	else
		return new Promise( (resolve) => waitForBackboneEventCallback( obj, evtName, fireEvent, resolve) );
}

function waitForBackboneEventCallback( obj, evtName, fireEvent, done ) {
	obj.on( evtName, function() { done() } );
	fireEvent();
}

function waitForTopicCallback( topicName, fireEvent, done, result ) {
	Topics.subscribe( topicName, function cb( data ) {
		if ( result ) {
			result.data = data;
		}
		Topics.unsubscribe(topicName, cb);
		done(data);
	} );
	fireEvent();
}

function waitForTopic( topicName, fireEvent, done, result ) {
	if ( done )
		waitForTopicCallback(topicName, fireEvent, done, result); 
	else
		return new Promise( (resolve) => waitForTopicCallback(topicName, fireEvent, resolve, result) );

}
// END TODO: convert to promises
function wrapViewInWindow( view ) {
	var win = Ti.UI.createWindow( { backgroundColor: 'white', width: Ti.UI.FILL, height: Ti.UI.FILL } );
	win.add( view );
	return win;
}

function windowOpenTest( win, done) {
	if ( done )
		windowOpenTestCallback(win, done); 
	else
		return new Promise( (resolve) => windowOpenTestCallback( win, resolve) );
}

function windowOpenTestCallback( win, done ) {
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
	return waitForBackboneEvent( evtObj, evtName, function() {
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

// Usage in an afterEach:
//   afterEach(async () => {
//     await closeWindow(win);   // blocks in --manual so the user can drive
//                               // the UI; cleanUp is deferred as a result.
//     ctl.cleanUp();            // runs once the window is actually closed
//   });
//
// The order matters: `cleanUp()` disposes the VM (clearing listeners),
// which dead-locks a live screen in manual mode. Always close first,
// then clean up.
//
// Supports both the legacy callback style `closeWindow(win, done)` and
// a promise-returning style `await closeWindow(win)`. In --manual mode
// on iOS there is intentionally no auto-close mechanism — the promise
// never resolves (and the legacy `done` never fires); the user
// terminates the test session externally (Ctrl-C grunt, stop the sim).
function closeWindow( win, done ) {
	return new Promise((resolve) => {
		win.addEventListener( "close", function handler() {
			win.removeEventListener( "close", handler );
			if ( done ) done();
			resolve();
		} );
		ifNotManual(() => win.close(), function() {
			Ti.API.info("[manual] Spec finished; window left open for inspection. " +
				"Android: tap Continue from the menu. iOS: kill the grunt process to end the session.");
			if ( win.activity ) {
				win.activity.onCreateOptionsMenu = (e) => {
					var menu = e.menu;
					var menuItem = menu.add( { title: "Continue", showAs: Ti.Android.SHOW_AS_ACTION_NEVER });
					menuItem.addEventListener("click", () => win.close() )
				}
			}
			// iOS manual: no auto-close — see comment above.
		});
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
	let mockPhoto = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "/spec/resources/site-mock.jpg");

	if ( ! mockPhoto.exists() ) {
		throw new Error(`${mockPhoto.nativePath} doesn't exist!`);
	}
	else {
		if ( photo.exists() ) {
			photo.deleteFile();
		}
		if ( ! mockPhoto.copy(photo.nativePath) ) {
			Ti.API.debug(`error copying file to: ${photo.nativePath}`);
		} else if ( ! photo.exists() ) {
			Ti.API.debug(`copying file to: ${photo.nativePath} succeeded but the file still doesn't exist?`);
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
exports.waitForBackboneEvent = waitForBackboneEvent;
exports.isManualTests = isManualTests;
exports.setManualTests = setManualTests;
exports.makeTestPhoto = makeTestPhoto;
exports.removeDatabase = removeDatabase;
exports.resetDatabase = resetDatabase;
exports.waitFor = waitFor;
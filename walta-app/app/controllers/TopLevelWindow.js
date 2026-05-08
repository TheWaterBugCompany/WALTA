var PlatformSpecific = require('logic/PlatformSpecific');
var Topics = require('ui/Topics');
var Logger = require('util/Logger');
var debug = (m, tag = "ui") => Logger.debug(m, tag);
var anchorBar = Alloy.createController("AnchorBar" );
var { disableControl, enableControl, setError, clearError } = require("ui/ViewUtils");

// Tracks whether the first postlayout has happened and safeAreaPadding
// (if any) has been applied to $.content. Consumers that subscribe to
// "safe-area-applied" after this point would miss the event, so they
// should fall back to checking this flag.
var safeAreaApplied = false;
function isSafeAreaApplied() { return safeAreaApplied; }
function openWindow() {
	if ( $.TopLevelWindow.title ) {
		anchorBar.setTitle( $.TopLevelWindow.title );
		$.content.width = Ti.UI.FILL;
		
		if ( Alloy.Globals.isSquare ) {
			$.content.top = "10%";
			$.content.height = "80%";
			anchorBar.getView().height = "5%";
		} else {
			$.content.height = "90%";
			anchorBar.getView().height = "10%";
		}
		anchorBar.getView().width = Ti.UI.FILL;
		$.TopLevelWindow.add( $.content );
		$.TopLevelWindow.add( anchorBar.getView() );
	} else {
		$.content.height = Ti.UI.FILL;
		$.content.width = Ti.UI.FILL;
		$.TopLevelWindow.add( $.content );
	}
	if ( $.TopLevelWindow.useUnSafeArea ) {
		// No safe-area adjustment is coming, but consumers still need
		// the signal to know layout is settled. Fire once on first
		// postlayout.
		$.TopLevelWindow.addEventListener('postlayout', function firstLayout() {
			$.TopLevelWindow.removeEventListener('postlayout', firstLayout);
			safeAreaApplied = true;
			$.trigger("safe-area-applied");
		});
	} else {
		$.TopLevelWindow.addEventListener('postlayout', updateSafeArea);
	}
	PlatformSpecific.transitionWindows( $.TopLevelWindow, $.args.slide );
	$.TopLevelWindow.addEventListener('postlayout',function() {
		$.trigger("window-opened");
		Topics.fireTopicEvent( Topics.PAGE_OPENED, { name: getName() } );
	})
	
}

function backEvent(e) {
	e.cancelBubble = true;
	console.log("androidback");
	Topics.fireTopicEvent( Topics.BACK, {} );
}

function updateSafeArea() {
    // Update the safe-area view's dimensions after every 'postlayout' event.
	let padding = $.TopLevelWindow.safeAreaPadding;
	//Ti.API.info(`safeAreaPadding = ${JSON.stringify(padding)}`)
	anchorBar.leftTools.left = padding.left;
	anchorBar.rightTools.right = padding.right;
	$.content.applyProperties(padding);
	// Signal once, after padding is applied, so consumers (e.g.
	// applyKeyboardTweaks) can restructure the view tree against the
	// final content dimensions rather than the pre-safe-area window
	// width (WB-28).
	if (!safeAreaApplied) {
		safeAreaApplied = true;
		$.trigger("safe-area-applied");
	}
}



$.TopLevelWindow.addEventListener( 'androidback', backEvent);

let swipeListenerAdded = false;
function noSwipeBack() {
	if  (swipeListenerAdded ) {
		$.TopLevelWindow.removeEventListener( 'swipe', swipeListener );
		swipeListenerAdded = false;
	}
}

function swipeListener(e){
	if ( e.direction === 'right' ) {
		e.cancelBubble = true;
		Topics.fireTopicEvent( Topics.BACK );
	}
}

function addSwipeBack() {
	swipeListenerAdded = true;
	$.TopLevelWindow.addEventListener('swipe', swipeListener);
}
// Swipe seems to conflict with the user interface on different screens...
// so making the execution decision to globally disable it.
//addSwipeBack();

$.TopLevelWindow.addEventListener('close', function cleanUp() {
	debug(`cleaning up window...`);
	$.destroy();
	$.off();
	anchorBar.cleanUp();
	noSwipeBack();
	$.TopLevelWindow.removeEventListener('androidback', backEvent );
	$.TopLevelWindow.removeEventListener('close', cleanUp );
	if ( ! $.TopLevelWindow.useUnSafeArea )
		$.TopLevelWindow.removeEventListener('postlayout', updateSafeArea );
});

function getAnchorBar() {
	return anchorBar;
}



function setErrorMessage( err ) {
	let msg;
	if ( err.errors && _(err.errors).keys().length > 0 ) {
		// concatenate all the error messages together
		msg = _(err.errors).values().map((e)=> e.join("\n")).join("\n");
	} else {
		msg = "There was a server error: check network connection.";
	}
	setErrorMessageString( msg );
}

function setErrorMessageString( msg ) {
	$.errorMessage.text = msg;
	$.errorMessage.visible = true;
}

function clearErrorMessage() {
	$.errorMessage.visible = false;
}

function getName() {
	return $.TopLevelWindow.title?$.TopLevelWindow.title:$.name;
}

exports.getName = getName;
exports.disableControl = disableControl;
exports.enableControl = enableControl;
exports.setError = setError;
exports.clearError = clearError;
exports.setErrorMessage = setErrorMessage;
exports.setErrorMessageString = setErrorMessageString;
exports.clearErrorMessage = clearErrorMessage;
exports.isSafeAreaApplied = isSafeAreaApplied;
exports.open = openWindow;
exports.getAnchorBar = getAnchorBar;
exports.noSwipeBack = noSwipeBack;

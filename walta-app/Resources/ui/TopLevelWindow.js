var _ = require('lib/underscore')._;

var PubSub = require('lib/pubsub');
var Layout = require('ui/Layout');

var Topics = require('ui/Topics');
var AnchorBar = require('ui/AnchorBar');

// Keep track of windows we've opened but not closed
var windowStack = [];

function _transitionWindows_iPhone( win, effect ) {
	var tx1, tx2;
	
	windowStack.push( win2 ); // remember new window
	
	var win1;
	var win2 = win;
	
	// We can only transition if we have a reference to the
	// previous window
	if ( windowStack.length > 1 ) {
		win1 = windowStack.shift();  // get previous window
		
		if (effect === 'left' || effect === 'right' ) {
			if ( effect === 'right' ) {
				tx1 = win1.size.width;
				tx2 = -tx1; 
			} else {
				tx2 = win1.size.width;
				tx1 = -tx2;	
			}
			
			win2.setTransform( Ti.UI.create2DMatrix().translate( tx1, 0 ) );
			win2.open(); // Open window first: opening a window is a heavy operation
			             // so we open it early to make sure it is ready to be
			             // animated instantly in the following code.
			var a1 = Ti.UI.createAnimation({ 
				transform: Ti.UI.create2DMatrix().translate( tx2, 0 ),
				duration: 400
			});
			var a2 = Ti.UI.createAnimation({
				transform: Ti.UI.create2DMatrix(),
				duration: 400
			});
			win2.animate( a2 ); 
			win1.close( a1 );
		} else {
			win2.open();
			win1.close();
		}
	} else {
		win2.open();
	}


}

function _transitionWindows_Android( win, effect ) {
	var args;
	
	windowStack.push( win );
	if ( effect === 'right' ) {
		args = { activityEnterAnimation: Ti.App.Android.R.anim.key_enter_right,
				activityExitAnimation: Ti.App.Android.R.anim.key_exit_left };
	} else if ( effect === 'left' ) {
		args = { activityEnterAnimation: Ti.App.Android.R.anim.key_enter_left,
				activityExitAnimation: Ti.App.Android.R.anim.key_exit_right };
	} else {
		args = { animate: false };
	}
	win.addEventListener( 'open', function() { 
		if ( windowStack.length > 1 ) {
			windowStack.shift().close();
		}
	});
	
	win.open( args );
	
}

function transitionWindows( win, effect ) {
	if ( Ti.Platform.osname === 'android') {
		_transitionWindows_Android( win, effect );
	} else if ( Ti.Platform.osname === 'iphone' ){
		_transitionWindows_iPhone( win, effect );
	}
}

/* 
 * All UI objects by convention return a Ti.UI.View 
 * as the parameter view. This function wraps the view
 * in a window and adds an AnchorBar to the top. 
 */
function makeTopLevelWindow( args ) {
	var oModes;
	if ( args.portrait ) {
		oModes = [ Ti.UI.PORTRAIT, Ti.UI.UPSIDE_PORTRAIT ]; 
	} else if ( args.swivel ) {
		oModes = [ Ti.UI.LANDSCAPE_LEFT, Ti.UI.LANDSCAPE_RIGHT, Ti.UI.PORTRAIT, Ti.UI.UPSIDE_PORTRAIT ];
	} else {
		oModes = [ Ti.UI.LANDSCAPE_LEFT ];
	}
	var win = Ti.UI.createWindow( { 
		navBarHidden: true, // necessary for Android to support orientationModes by forcing heavy weight windows
		fullscreen: true,
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		backgroundColor: 'white',
		layout: 'composite',
		orientationModes:  oModes
	});
	
	var panelHeight = Ti.UI.FILL;
	
	if ( args.title ) {
		var anchorBar = AnchorBar.createAnchorBar( args.title );
		win.add( anchorBar.view );	
		
		panelHeight = Ti.Platform.displayCaps.getPlatformHeight();
		
		if ( Ti.Platform.osname === 'android') {
			panelHeight = Ti.UI.convertUnits( panelHeight + "px", "dip" );
		}
		
		panelHeight = panelHeight - Ti.UI.convertUnits( Layout.TOOLBAR_HEIGHT, "dip" );
		
	}
	
	if ( args.uiObj.openingFromMenu ) {
		args.uiObj.openingFromMenu( { anchorBar: anchorBar });
	}

	win.add( _(args.uiObj.view).extend({
		top: 0,
		width: Ti.UI.FILL,
		height: panelHeight
	}) );

	win.addEventListener( 'android:back', function(e) {
		e.cancelBubble = true;
		PubSub.publish( Topics.BACK, null );
	});
	
	if ( args.onOpen )
		win.addEventListener('open', args.onOpen );
	transitionWindows( win, args.slide );

	return win;
}

exports.transitionWindows = transitionWindows;
exports.makeTopLevelWindow = makeTopLevelWindow;
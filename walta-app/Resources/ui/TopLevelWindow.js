var _ = require('lib/underscore')._;

var PubSub = require('lib/pubsub');
var Layout = require('ui/Layout');

var Topics = require('ui/Topics');
var AnchorBar = require('ui/AnchorBar');

function iPhone_Slide( win1, win2, dir ) {
	var tx1, tx2;
	
	if ( dir == 'right' ) {
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

}


/* 
 * All UI objects by convention return a Ti.UI.View 
 * as the parameter view. This function wraps the view
 * in a window and adds an AnchorBar to the top. 
 */
function	makeTopLevelWindow( args, lastWindow ) {
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
		panelHeight = Ti.UI.convertUnits( panelHeight + "px", "dip" ) - Ti.UI.convertUnits( Layout.TOOLBAR_HEIGHT, "dip" );
		
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
	
	// Transition the windows
	if ( Ti.Platform.osname === 'android' && this.lastWindow ) {
		win.addEventListener('open',function() { lastWindow.close(); });
	}
	
	
	if ( args.slide == 'right' ) {
		if ( Ti.Platform.osname === 'android') {
			win.open({
				activityEnterAnimation: Ti.App.Android.R.anim.key_enter_right,
				activityExitAnimation: Ti.App.Android.R.anim.key_exit_left
			});
		} else {
			iPhone_Slide( lastWindow, win, args.slide );
		}
	} else if ( args.slide == 'left' ) {
		if ( Ti.Platform.osname === 'android') {
			win.open({
				activityEnterAnimation: Ti.App.Android.R.anim.key_enter_left,
				activityExitAnimation: Ti.App.Android.R.anim.key_exit_right
			});
			
		} else {
			iPhone_Slide( lastWindow, win, args.slide );
		}
	} else {
		win.open();
	}
	return win;
}

exports.makeTopLevelWindow = makeTopLevelWindow;
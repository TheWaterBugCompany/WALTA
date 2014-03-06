var PlatformSpecific = require('ui/PlatformSpecific');

/* 
 * All UI objects by convention return a Ti.UI.View 
 * as the parameter view. This function wraps the view
 * in a window and adds an AnchorBar to the top. 
 */
function makeTopLevelWindow( args ) {
	
	var _ = require('lib/underscore')._;
	
	var PubSub = require('lib/pubsub');
	var Layout = require('ui/Layout');
	
	var Topics = require('ui/Topics');
	var AnchorBar = require('ui/AnchorBar');
		
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
		
		panelHeight = PlatformSpecific.convertSystemToDip( Ti.Platform.displayCaps.getPlatformHeight() );
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
	
	PlatformSpecific.transitionWindows( win, args.slide );

	return win;
}

exports.transitionWindows = PlatformSpecific.transitionWindows;
exports.makeTopLevelWindow = makeTopLevelWindow;
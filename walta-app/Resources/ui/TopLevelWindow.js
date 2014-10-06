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
var PlatformSpecific = require('ui/PlatformSpecific');

var _currentWindow;

function getCurrentWindow() { return _currentWindow; }

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

	_currentWindow = args;
	return win;
}

exports.transitionWindows = PlatformSpecific.transitionWindows;
exports.makeTopLevelWindow = makeTopLevelWindow;
exports.getCurrentWindow = getCurrentWindow;
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
var _ = require('lib/underscore')._;

var Layout = require('ui/Layout');

var Topics = require('ui/Topics');
var AnchorBar = require('ui/AnchorBar');
var _currentWindow;

function closeCurrentWindow() { _currentWindow.win.close(); }

function getCurrentWindow() { return _currentWindow; }

/* 
 * All UI objects by convention return a Ti.UI.View 
 * as the parameter view. This function wraps the view
 * in a window and adds an AnchorBar to the top. 
 */

function makeTopLevelWindow( args ) {

	var winArgs = { 
		navBarHidden: true,
		fullscreen: true,
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		backgroundColor: 'white',
		layout: 'composite',
		title: args.title	
	};
	
	PlatformSpecific.preCreateTopLevelWindow( winArgs, args );
	
	
	var win = Ti.UI.createWindow( winArgs );
	
	var panelHeight = Ti.UI.FILL;

	if ( args.title ) {
		
		var anchorBar = AnchorBar.createAnchorBar( args.title );
		win.add( anchorBar.view );	
		PlatformSpecific.makeAnchorBarStationary( win, anchorBar );
		panelHeight = PlatformSpecific.convertSystemToDip( Ti.Platform.displayCaps.getPlatformHeight() );
		panelHeight = panelHeight - Ti.UI.convertUnits( Layout.TOOLBAR_HEIGHT, "dip" );
		
	} else {
		anchorBar == null;
	}
	
	if ( args.uiObj.openingFromMenu ) {
		args.uiObj.openingFromMenu( { anchorBar: anchorBar });
	}

	win.add( _(args.uiObj.view).extend({
		exitOnClose: false,
		top: 0,
		width: Ti.UI.FILL,
		height: panelHeight
	}) );

	win.addEventListener( 'androidback', function(e) {
		e.cancelBubble = true;
		Topics.fireTopicEvent( Topics.BACK, e );
	});
	
	if ( args.onOpen )
		win.addEventListener('open', args.onOpen );
	
	PlatformSpecific.transitionWindows( win, args.slide );
	_currentWindow = args;
	_currentWindow.win = win; 
}

exports.transitionWindows = PlatformSpecific.transitionWindows;
exports.makeTopLevelWindow = makeTopLevelWindow;
exports.closeCurrentWindow = closeCurrentWindow;
exports.getCurrentWindow = getCurrentWindow;
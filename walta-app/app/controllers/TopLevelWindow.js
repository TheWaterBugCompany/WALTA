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
var Layout = require('ui/Layout');
var Topics = require('ui/Topics');

function closeCurrentWindow() { Alloy.Globals["currentWindow"].win.close(); }

function getCurrentWindow() { return Alloy.Globals["currentWindow"]; }

var win = $.TopLevelWindow;
win.title = $.args.title;

var panelHeight = Ti.UI.FILL;

if ( $.args.title ) {
	var anchorBar = Alloy.createController("AnchorBar", $.args );
	win.add( anchorBar.getView() );
	panelHeight = PlatformSpecific.convertSystemToDip( Ti.Platform.displayCaps.getPlatformHeight() );
	panelHeight = panelHeight - Ti.UI.convertUnits( Layout.TOOLBAR_HEIGHT, "dip" );
} else {
	anchorBar == null;
}

if ( $.args.uiObj.openingFromMenu ) {
	$.args.uiObj.openingFromMenu( { anchorBar: anchorBar });
}

win.add( _($.args.uiObj.view).extend({
	exitOnClose: false,
	top: 0,
	width: Ti.UI.FILL,
	height: panelHeight
}) );

win.addEventListener( 'androidback', function(e) {
	e.cancelBubble = true;
	Topics.fireTopicEvent( Topics.BACK, e );
});

if ( $.args.onOpen )
	win.addEventListener('open', $.args.onOpen );

if ( $.args.cleanup )
	win.addEventListener('close', $.args.cleanup );

PlatformSpecific.transitionWindows( win, $.args.slide );

Alloy.Globals["currentWindow"] = $.args;
Alloy.Globals["currentWindow"].win = win;

exports.transitionWindows = PlatformSpecific.transitionWindows;
exports.closeCurrentWindow = closeCurrentWindow;
exports.getCurrentWindow = getCurrentWindow;

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
var Topics = require('ui/Topics');
var GeoLocationService = require('logic/GeoLocationService');
var anchorBar = Alloy.createController("AnchorBar" );
function openWindow() {
	if ( $.TopLevelWindow.title ) {
		anchorBar.setTitle( $.TopLevelWindow.title );
		$.TopLevelWindow.add( anchorBar.getView() );
		function adjustContentSize() {
			$.content.top = 0;
			$.content.height = $.TopLevelWindow.size.height - anchorBar.getView().size.height;
			$.TopLevelWindow.add( $.content );
		}
		$.TopLevelWindow.addEventListener("postlayout", adjustContentSize );
		$.TopLevelWindow.addEventListener("close", function cleanUp() {
			$.TopLevelWindow.removeEventListener('postlayout', adjustContentSize );
			$.TopLevelWindow.removeEventListener('close', cleanUp );
		});
	} else {
		$.TopLevelWindow.add( $.content );
	}
	
	PlatformSpecific.transitionWindows( $.TopLevelWindow, $.args.slide );
}

function backEvent(e) {
	e.cancelBubble = true;
	Topics.fireTopicEvent( Topics.BACK, $.name );
}

function startGps() {
    GeoLocationService.start();
}

$.TopLevelWindow.addEventListener( 'open', startGps);
$.TopLevelWindow.addEventListener( 'androidback', backEvent);
$.TopLevelWindow.addEventListener('close', function cleanUp() {
	GeoLocationService.stop();
	$.TopLevelWindow.removeEventListener('open', startGps );
	$.TopLevelWindow.removeEventListener('close', backEvent );
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});

function getAnchorBar() {
	return anchorBar;
}
exports.open = openWindow;
exports.getAnchorBar = getAnchorBar;

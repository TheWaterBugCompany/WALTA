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
var anchorBar = Alloy.createController("AnchorBar" );
function openWindow() {
	Ti.API.info(`Opening window "${getName()}"`);
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
			Ti.API.info(`Closing window "${getName()}"`);
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

$.TopLevelWindow.addEventListener( 'androidback', backEvent);
$.TopLevelWindow.addEventListener('close', function cleanUp() {
	$.destroy();
	$.TopLevelWindow.removeEventListener('androidback', backEvent );
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});

function getAnchorBar() {
	return anchorBar;
}

function disable(view) {
	view.enabled = false;
	view.touchEnabled = false;
	view.backgroundColor = "#c9cacb";
	view.borderColor = "#c9cacb";
	view.color = "white"; 
}

function enable(view) {
	view.enabled = true;
	view.touchEnabled = true;
	view.backgroundColor = "#b4d2d9";
	view.borderColor = "#b4d2d9";
	view.color = "#26849c";
}

function setError(view) {
	view.color = "red";
	view.borderColor = "red";
}

function clearError(view) {
	view.color = "#26849c";
	view.borderColor = "#26849c";
}

function setErrorMessage( err ) {
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
exports.disable = disable;
exports.enable = enable;
exports.setError = setError;
exports.clearError = clearError;
exports.setErrorMessage = setErrorMessage;
exports.setErrorMessageString = setErrorMessageString;
exports.clearErrorMessage = clearErrorMessage;
exports.open = openWindow;
exports.getAnchorBar = getAnchorBar;

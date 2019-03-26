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
var { disableControl, enableControl, setError, clearError } = require("ui/ViewUtils");
function openWindow() {
	Ti.API.debug(`Opening window "${getName()}"`);
	if ( $.TopLevelWindow.title ) {
		anchorBar.setTitle( $.TopLevelWindow.title );
		$.content.top = 0;
		$.content.height = "90%";
		$.content.width = Ti.UI.FILL;
		anchorBar.getView().height = "10%";
		anchorBar.getView().width = Ti.UI.FILL;
		$.TopLevelWindow.add( $.content );
		$.TopLevelWindow.add( anchorBar.getView() );
	} else {
		$.content.height = Ti.UI.FILL;
		$.content.width = Ti.UI.FILL;
		$.TopLevelWindow.add( $.content );
	}
	
	PlatformSpecific.transitionWindows( $.TopLevelWindow, $.args.slide );
}

function backEvent(e) {
	e.cancelBubble = true;
	Topics.fireTopicEvent( Topics.BACK, { name: $.name, surveyType: $.args.surveyType, allowAddToSample: ($.args.allowAddToSample?true : false) } );
}

$.TopLevelWindow.addEventListener( 'androidback', backEvent);
$.TopLevelWindow.addEventListener('close', function cleanUp() {
	$.destroy();
	$.off();
	$.TopLevelWindow.removeEventListener('androidback', backEvent );
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});

function getAnchorBar() {
	return anchorBar;
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
exports.disableControl = disableControl;
exports.enableControl = enableControl;
exports.setError = setError;
exports.clearError = clearError;
exports.setErrorMessage = setErrorMessage;
exports.setErrorMessageString = setErrorMessageString;
exports.clearErrorMessage = clearErrorMessage;
exports.open = openWindow;
exports.getAnchorBar = getAnchorBar;

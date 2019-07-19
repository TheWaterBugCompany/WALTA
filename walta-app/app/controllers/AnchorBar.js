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

/*
 * Module: AnchorBar
 *
 * Creates the anchor bar header section of the user interface. When the buttons are pressed
 * global topics are published to cause the application controller to transition to the correct
 * view.
 *
 */
var Topics = require('ui/Topics');
var { setAccessibilityLabel } = require('ui/ViewUtils');

var eventHandlers = [];
function cleanUp() {
	$.destroy();
	$.off();
	eventHandlers.forEach( function(d) {
		d.btn.removeEventListener( 'click', d.handler );
	});
	eventHandlers = null;
}

function createToolBarButton( image, topic, title, eventData ) {
	var btn;

	if ( ! image ) {
		btn = Ti.UI.createLabel({ class: "labelText", text: title.toUpperCase() });
	} else {
		btn = Ti.UI.createImageView({ image: image, width: Ti.UI.SIZE, height: Ti.UI.SIZE });
	}	
	
	if ( title ) {
		$.addClass( btn, "anchorBarTextButton" );
		$.addClass( btn, "anchorBarTextButtonLabel" );
	} else {
		$.addClass( btn, "anchorBarButton" );
	}
	
	if ( topic ) {
		var handler = function(e) {
			Topics.fireTopicEvent( topic, eventData );
			e.cancelBubble = true;
		};
		eventHandlers.push( {
			handler:  handler,
			btn: btn
		});

		btn.addEventListener( 'click', handler );
	}
	
	$[topic] = btn;
	return btn;
}

function addTool( view, left ) {
	if ( left ) {
		$.leftTools.add( view );
	} else {
		$.rightTools.add( view );
	}
}



function setTitle( title ) {
	$.title.text = title;
	setAccessibilityLabel( $.title, "toolbar", title);
}

setTitle( $.args.title );
$.home = createToolBarButton( '/images/icon-home-white.png', Topics.HOME );
$.leftTools.add( $.home );
$.leftTools.add( createToolBarButton( '/images/icon-about-white.png', Topics.HELP ) );

exports.createToolBarButton = createToolBarButton;

exports.setTitle = setTitle;
exports.addTool = addTool;
exports.cleanUp = cleanUp;

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
var Layout = require('ui/Layout');
var Topics = require('ui/Topics');

function createToolBarButton( image, topic ) {
	var btn = Ti.UI.createButton({
		left: Layout.BUTTON_MARGIN,
		width: Layout.TOOLBAR_BUTTON_SIZE,
		height: Layout.TOOLBAR_BUTTON_SIZE,
		backgroundImage: image
	});

	if ( topic ) {
		btn.addEventListener( 'click', function(e) {
			Topics.fireTopicEvent( topic, null );
			e.cancelBubble = true;
		});
	}
	return btn;
}

function addTool( view ) {
	$.rightTools.add( view );
}

$.title.text = $.args.title
$.home = createToolBarButton( '/images/icon-home-white.png', Topics.HOME );
$.leftTools.add( $.home );
$.leftTools.add( createToolBarButton( '/images/icon-about-white.png', Topics.HELP ) );

addTool( createToolBarButton( '/images/icon-speedbug-white.png', Topics.SPEEDBUG ) );
addTool( createToolBarButton( '/images/icon-browse-white.png', Topics.BROWSE ) );

exports.createToolBarButton = createToolBarButton;
exports.addTool = addTool;

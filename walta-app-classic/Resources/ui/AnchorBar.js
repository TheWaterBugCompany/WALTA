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

var _ = require('lib/underscore')._;
var Layout = require('ui/Layout');
var Topics = require('ui/Topics');



// Create a tool bar button
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

// Create an anchor bar View
function createAnchorBar( title ) {
	

	var anchorBar = {
		title: title
	};
	
	anchorBar._views = {};
	
	anchorBar.view = Ti.UI.createView({
		transitionName: 'anchorBar',
   		backgroundGradient: {
   			type: 'linear',
   			startPoint: { x: '0%', y: '0%' },
   			endPoint: { x: '0%', y: '100%' },
   			colors: [ {color: '#2f61cc', offset: 0.0 }, {color: '#7797de', offset: 1.0 } ] 
   		},
   		bottom:0,
   		height: Layout.TOOLBAR_HEIGHT,
   		layout: 'composite'
	});
	
	anchorBar._views.leftTools = Ti.UI.createView({
		top: 0,
		left: 0,
		width: Ti.UI.SIZE,
		height: Ti.UI.FILL,
		layout: 'horizontal',
		horizontalWrap: false
	});
	
	anchorBar._views.title = Ti.UI.createLabel({
		text: anchorBar.title,
		font: { font: Layout.HEADING_FONT, fontSize: Layout.HEADING_SIZE },
		color: 'white',
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		width: Ti.UI.SIZE,
		height: Ti.UI.FILL,
		right: '50%'
	});
	
	anchorBar._views.rightTools = Ti.UI.createView({
		top: '2dip',
		bottom: '2dip',
		right: '4dip',
		width: Ti.UI.SIZE,
		height: Ti.UI.FILL,
		layout: 'horizontal',
		horizontalWrap: false
	});
	
	// Create tool bar buttons
	anchorBar._views.home = createToolBarButton( '/images/icon-home-white.gif', Topics.HOME );
	anchorBar._views.info = createToolBarButton( '/images/icon-about-white.gif', Topics.HELP );
	
	anchorBar._views.leftTools.add( anchorBar._views.home );
	anchorBar._views.leftTools.add( anchorBar._views.info );
	
	anchorBar.view.add( anchorBar._views.leftTools );
	anchorBar.view.add( anchorBar._views.title );
	anchorBar.view.add( anchorBar._views.rightTools );
	
	_(anchorBar).extend({
		addTool: function( view ) {
			anchorBar._views.rightTools.add( view );
		}
	});
	
	anchorBar.addTool( createToolBarButton( '/images/icon-speedbug-white.gif', Topics.SPEEDBUG ) );
	anchorBar.addTool( createToolBarButton( '/images/icon-browse-white.gif', Topics.BROWSE ) );
	
	return anchorBar;
};

exports.createToolBarButton = createToolBarButton;
exports.createAnchorBar = createAnchorBar;
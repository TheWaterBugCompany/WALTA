/*
 * Module: AnchorBar
 * 
 * Creates the anchor bar header section of the user interface. When the buttons are pressed
 * global topics are published to cause the application controller to transition to the correct
 * view.
 * 
 */

var _ = require('lib/underscore')._;
var PubSub = require('lib/pubsub');
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
			PubSub.publish( topic, null );
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
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
		width: Ti.UI.SIZE,
		height: Ti.UI.FILL
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
	anchorBar._views.home = createToolBarButton( '/images/home.png', Topics.HOME );
	//anchorBar._views.settings = createToolBarButton( '/images/settings.png', Topics.SETTINGS );
	anchorBar._views.info = createToolBarButton( '/images/info.png', Topics.INFO );
	
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
	
	
	return anchorBar;
};

exports.createToolBarButton = createToolBarButton;
exports.createAnchorBar = createAnchorBar;
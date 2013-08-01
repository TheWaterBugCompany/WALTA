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

// Constants
var TOOLBAR_HEIGHT = '32dip';
var BUTTON_SIZE =  '28dip';
var BUTTON_MARGIN = '2dip';
var TITLE_SIZE = '24dip';
var TITLE_FONT = 'Tahoma';

// Topics that this module publishes
var topics = { 
	HOME: 'home',
	SETTINGS: 'settings',
	INFO: 'info'
}

// Create a tool bar button
function createToolBarButton( image, topic ) {
	var btn = Ti.UI.createButton({
		top: BUTTON_MARGIN,
		left: BUTTON_MARGIN,
		width: BUTTON_SIZE,
		height: BUTTON_SIZE,
		backgroundImage: image
	});
	btn.addEventListener( 'click', function(e) {
		PubSub.publish( topic, null );
		e.cancelBubble = true;
	});
	return btn;
}

// Create an anchor bar View
function createAnchorBar( args ) {
	
	var anchorBar = _(args || {} ).defaults({
		title: 'Title'
	});
	
	var abr = Ti.UI.createView({
   		backgroundGradient: {
   			type: 'linear',
   			startPoint: { x: '0%', y: '0%' },
   			endPoint: { x: '0%', y: '100%' },
   			colors: [ {color: '#2f61cc', offset: 0.0 }, {color: '#7797de', offset: 1.0 } ] 
   		},
   		left:0,
   		right:0,
   		top:0,
   		height: TOOLBAR_HEIGHT,
   		layout: 'composite'
	});
	
	var leftTools = Ti.UI.createView({
		top: 0,
		left: 0,
		width: Ti.UI.SIZE,
		height: Ti.UI.FILL,
		layout: 'horizontal',
		horizontalWrap: false
	});
	
	
	var title = Ti.UI.createLabel({
		text: anchorBar.title,
		font: { font: TITLE_FONT, fontSize: TITLE_SIZE },
		color: 'white',
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
		width: Ti.UI.SIZE,
		height: Ti.UI.FILL
	});
	
	
	var rightTools = Ti.UI.createView({
		top: 0,
		right: 0,
		width: Ti.UI.SIZE,
		height: Ti.UI.FILL,
		layout: 'horizontal',
		horizontalWrap: false
	});
	
	// Create tool bar buttons
	leftTools.add( createToolBarButton( '../images/home.png', topics.HOME ) );
	rightTools.add( createToolBarButton( '../images/settings.png', topics.SETTINGS ) );
	rightTools.add( createToolBarButton( '../images/info.png', topics.INFO ) );
	
	abr.add( leftTools );
	abr.add( title );
	abr.add( rightTools );
	
	return abr;
};

exports.topics = topics;
exports.createAnchorBar = createAnchorBar;
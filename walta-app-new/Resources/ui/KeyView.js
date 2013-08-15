/*
 * Module: KeyView
 * 
 * Displays a choice between a binary set of Questions stored in a
 * KeyNode object.
 * 
 */
var _ = require('lib/underscore')._;
var PubSub = require('lib/pubsub');

var Layout = require('ui/Layout');
var QuestionView = require('ui/QuestionView');

var topics = {
	BACK: 'back'
}

function createKeyView( key ) {
	var obj = {
		view: null,		 // The Ti.UI.View for the user interface
		key: key         // The Key data object associated with this view
	};
	var anchor = AnchorBar.createAnchorBar( { title: "ALT Key" } );
	
	obj.view = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		backgroundColor: 'white',
		layout: 'vertical'
	});
	
	// Add the anchor bar
	obj.view.add( anchor.view );
	
	// Add each question
	_(key.currentDecision.questions).each(
		function( q ) {
			var qv = QuestionView.createQuestionView( q );
			obj.view.add( _(qv.view).extend( { width: '95%', height: '42%'}) );
		}
	);
	
	// Add the go back button
	var btn = Ti.UI.createButton( {
		width: Layout.BUTTON_SIZE,
		height: Layout.BUTTON_SIZE,
		backgroundImage: '/images/back.png'
	} );
	btn.addEventListener( 'click', function() {
		PubSub.publish( topics.BACK, null );
		e.cancelBubble = true;
	} );
	
	obj.view.add( btn );
	return obj;
}

exports.createKeyView = createKeyView;

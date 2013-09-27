/*
 * Module: KeyView
 * 
 * Displays a choice between a binary set of Questions stored in a
 * KeyNode object.
 * 
 */
var _ = require('lib/underscore')._;
var PubSub = require('lib/pubsub');
var meld = require('lib/meld');
var AnchorBar = require('ui/AnchorBar');
var Layout = require('ui/Layout');
var QuestionView = require('ui/QuestionView');

var Topics = require('ui/Topics');

function createKeyView( keyNode ) {
	var obj = {
		view: null,		 // The Ti.UI.View for the user interface
		keyNode: keyNode // The Key data object associated with this view
	};
	obj._views = {};
	
	obj.view = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		backgroundColor: 'white',
		layout: 'vertical'
	});
	
	// Add each question
	obj._views.questions = [];
	_(keyNode.questions).each(
		function( q ) {
			var qv = QuestionView.createQuestionView( q );
			obj.view.add( _(qv.view).extend( { width: '95%', height: '42%', top: Layout.WHITESPACE_GAP }) );
			var index = obj._views.questions.length;
			obj._views.questions.push( qv );
			
			meld.on( qv, 'onSelect', function() { 
				PubSub.publish( Topics.FORWARD, index );
			} );
		}
	);
	
	// Add the go back button
	var btn = Ti.UI.createButton( {
		title: 'Go back',
		top: Layout.WHITESPACE_GAP,
		bottom: Layout.WHITESPACE_GAP,
		right: Layout.WHITESPACE_GAP,
		width: Ti.UI.SIZE,
		height: Ti.UI.FILL,
		borderRadius: Layout.BORDER_RADIUS_MENU_SMALL,
		backgroundColor: '#552F61CC',
		backgroundImage: '/images/back.png'
	} );
	btn.addEventListener( 'click', function(e) {
		PubSub.publish( Topics.BACK, null );
		e.cancelBubble = true;
	} );
	
	obj.view.add( btn );
	obj._views.backBtn = btn;
	return obj;
}

exports.createKeyView = createKeyView;

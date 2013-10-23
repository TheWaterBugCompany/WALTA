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
		top: '1%',
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		backgroundColor: 'white',
		layout: 'vertical'
	});
	
	var heading = Ti.UI.createLabel({
		text: 'Choose the best match', 
		font: { fontFamily: 'Tahoma', fontSize: '15dip' },
		color: 'black' 
	});
	obj.view.add( heading );
	
	// Add each question
	obj._views.questions = [];
	_(keyNode.questions).each(
		function( q ) {
			var qv = QuestionView.createQuestionView( q );
			obj.view.add( _(qv.view).extend( { width: '95%', height: '40%', top: '1%', bottom: '1%' }) );
			var index = obj._views.questions.length;
			obj._views.questions.push( qv );
			
			meld.on( qv, 'onSelect', function() { 
				PubSub.publish( Topics.FORWARD, index );
			} );
		}
	);
	
	// Add the go back button
	var goBack = Ti.UI.createView({
		right: '2.5%',
		width: Ti.UI.SIZE,
		bottom: '1%',
		height: '8%',
		borderRadius: Layout.BORDER_RADIUS_BUTTON,
		backgroundColor: '#BB2F61CC',
		layout: 'horizontal',
		horizontalWrap: false
	});
	goBack.add( Ti.UI.createImageView( { 
		width: '45dip', 
		height: '45dip', 
		image: '/images/back.png'
	} ) );
	goBack.add( Ti.UI.createLabel( { 
		width: Ti.UI.SIZE, 
		height: Ti.UI.SIZE, 
		right: Layout.WHITESPACE_GAP,
		text: 'No match? Go back', 
		font: { fontFamily: 'Tahoma', fontSize: '15dip' },
		color: 'black' 
	} ) );
	goBack.addEventListener( 'click', function(e) {
		PubSub.publish( Topics.BACK, null );
		e.cancelBubble = true;
	} );
	
	obj.view.add( goBack );
	obj._views.backBtn = goBack;
	return obj;
}

exports.createKeyView = createKeyView;

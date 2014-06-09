/*
 * Module: KeyView
 * 
 * Displays a choice between a binary set of Questions stored in a
 * KeyNode object.
 * 
 */


function createKeyView( keyNode ) {
	var _ = require('lib/underscore')._;
	var PubSub = require('lib/pubsub');
	
	var AnchorBar = require('ui/AnchorBar');
	var Layout = require('ui/Layout');
	
	var GoBackButton = require('ui/GoBackButton');
	var Topics = require('ui/Topics');
	
	var meld = require('lib/meld');
	var QuestionView = require('ui/QuestionView');
	
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
			obj.view.add( _(qv.view).extend( { width: '95%', height: '44%', top: '1%', bottom: '1%' }) );
			var index = obj._views.questions.length;
			obj._views.questions.push( qv );
			
			meld.on( qv, 'onSelect', function() { 
				PubSub.publish( Topics.FORWARD, index );
			} );
		}
	);
	
	obj.view.addEventListener('swipe', function(e){
		if ( e.direction === 'right' ) {
			e.cancelBubble = true;
			PubSub.publish( Topics.BACK );
		} else if ( e.direction === 'up' ) {
			e.cancelBubble = true;
			PubSub.publish( Topics.SPEEDBUG );
		} else if ( e.direction === 'down' ) {
			e.cancelBubble = true;
			PubSub.publish( Topics.BROWSE );
		}
	});
	
	_(obj).extend({
		openingFromMenu: function( args ) {
			if ( args.anchorBar ) {
				var anchorBar = args.anchorBar;
				anchorBar.addTool( GoBackButton.createGoBackButton() );
			}
		}
	});
	return obj;
}

exports.createKeyView = createKeyView;

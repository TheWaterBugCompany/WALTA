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
 * Module: KeyView
 * 
 * Displays a choice between a binary set of Questions stored in a
 * KeyNode object.
 * 
 */


function createKeyView( keyNode, platformHeight ) {
	var _ = require('lib/underscore')._;
	
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
				Topics.fireTopicEvent( Topics.FORWARD, { index: index } );
			} );
		}
	);
	
	obj.view.addEventListener('swipe', function(e){
		if ( e.direction === 'right' ) {
			e.cancelBubble = true;
			Topics.fireTopicEvent( Topics.BACK );
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

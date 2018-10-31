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
 * KeySearch
 *
 * Displays a choice between a binary set of Questions stored in a
 * KeyNode object.
 *
 */

var Layout = require('ui/Layout');
var GoBackButton = require('ui/GoBackButton');
var Topics = require('ui/Topics');
var QuestionView = require('ui/QuestionView');
var meld = require("lib/meld");

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "ALT Key";
$.name = "decision";
var acb = $.getAnchorBar();
acb.addTool( acb.createToolBarButton( '/images/icon-speedbug-white.png', Topics.SPEEDBUG ), true );
acb.addTool( acb.createToolBarButton( '/images/icon-browse-white.png', Topics.BROWSE ), true );
acb.addTool( GoBackButton.createGoBackButton() );


var keyNode = $.args.keyNode;
var questions = [];
function getQuestions() {
  return questions;
}
// Add each question
_(keyNode.questions).each(
	function( q, index ) {
		var qv = QuestionView.createQuestionView( q );
    questions.push( qv );
		$.content.add( _(qv.view).extend( { width: '95%', height: '44%', top: '1%', bottom: '1%' }) );
		meld.on( qv, 'onSelect', function() {
			Topics.fireTopicEvent( Topics.FORWARD, { index: index, allowAddToSample: $.args.allowAddToSample } );
		} );
	}
);

function swipeListener(e){
	if ( e.direction === 'right' ) {
		e.cancelBubble = true;
		Topics.fireTopicEvent( Topics.BACK );
	}
}

$.content.addEventListener('swipe', swipeListener);

$.content.addEventListener( "close", function cleanup() {
  $.content.removeEventListener( 'swipe', swipeListener );
  $.content.removeEventListener( 'swipe', cleanup );
});

exports.getQuestions = getQuestions;

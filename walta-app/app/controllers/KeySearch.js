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
var Topics = require('ui/Topics');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "ALT Key";
$.name = "decision";

var keyNode = $.args.keyNode;
var questions = [];

function swipeListener(e){
	if ( e.direction === 'right' ) {
		e.cancelBubble = true;
		Topics.fireTopicEvent( Topics.BACK, $.name  );
	}
}

$.TopLevelWindow.addEventListener('swipe', swipeListener);
$.TopLevelWindow.addEventListener('close', function cleanUp() {
  $.destroy();
  $.off();
  $.content.removeEventListener('swipe', swipeListener);
  goBackBtn.cleanUp();
  questions.forEach( function(q) { q.cleanUp(); } );
  questions = null;
  $.TopLevelWindow.removeEventListener('close', cleanUp );
});

var acb = $.getAnchorBar(); 
$.args.name = "decision";
var goBackBtn = Alloy.createController("GoBackButton", $.args );
acb.addTool( acb.createToolBarButton( '/images/icon-speedbug-white.png', Topics.SPEEDBUG, null, { surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample } ), true );
acb.addTool( acb.createToolBarButton( '/images/icon-browse-white.png', Topics.BROWSE, null, { surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample }  ), true );
acb.addTool( goBackBtn.getView() );


// Add each question
_(keyNode.questions).each( 
	function( q, index ) {
		var qv = Alloy.createController("Question", { question: q, label: (index === 0 ? 'top' : 'bottom') });
    questions.push( qv );
    $.content.add( _(qv.getView()).extend( { width: '95%', height: '44%', top: '1%', bottom: '1%' }) );
    qv.on("select",function() {
			Topics.fireTopicEvent( Topics.FORWARD, { index: index, surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample } );
		});
	}
);

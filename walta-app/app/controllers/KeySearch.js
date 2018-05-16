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
var PlatformSpecific = require('ui/PlatformSpecific');
var meld = require('lib/meld');

var platformHeight = PlatformSpecific.convertSystemToDip( Titanium.Platform.displayCaps.platformHeight );

var obj = {
	view: null,		 // The Ti.UI.View for the user interface
	keyNode: keyNode // The Key data object associated with this view
};

var keyNode = $.args.keyNode;
var questions = [];

obj.view = $.KeySearch;

// Add each question
_(keyNode.questions).each(
	function( q, index ) {
		var qv = QuestionView.createQuestionView( q );
    questions.push( qv );
		$.KeySearch.add( _(qv.view).extend( { width: '95%', height: '44%', top: '1%', bottom: '1%' }) );
		meld.on( qv, 'onSelect', function() {
			Topics.fireTopicEvent( Topics.FORWARD, { index: index } );
		} );
	}
);

function swipeListener(e){
	if ( e.direction === 'right' ) {
		e.cancelBubble = true;
		Topics.fireTopicEvent( Topics.BACK );
	}
};
obj.view.addEventListener('swipe', swipeListener);

function cleanup() {
  obj.view.removeEventListener( 'swipe', swipeListener );
  //questions.forEach( (qv) => meld.off( qv, 'onSelect') );
}

Alloy.createController("TopLevelWindow", {
  name: 'decision',
  title: 'ALT Key',
  uiObj: {view: $.getView() },
  slide: $.args.slide,
  cleanup: cleanup
}).getAnchorBar()
  .addTool( GoBackButton.createGoBackButton() );

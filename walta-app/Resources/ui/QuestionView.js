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
 * walta/QuestionView
 *
 * Creates the corresponding view for the question
 * datastructure.
 *  
 */

function createQuestionView(  /* Question */ qn ) {
	var _ = require('lib/underscore')._;
	var PhotoView = require('ui/PhotoView');
	var Layout = require('ui/Layout');	
	
	var qnViewObj = {
		_views: {},
		view: null,					 // The Ti.UI.View for the user interface
		question: qn,                // The Question data object associated with this view
		onSelect: function( e ) {}   // Event called when question is selected.
	};
	
	var vws = qnViewObj._views;
	
	var qnView = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		borderRadius: Layout.BORDER_RADIUS,
		backgroundColor: '#552F61CC',
		layout: 'composite',
		horizontalWrap: false
	});

	vws.arrow = Ti.UI.createView({
		width: '14dip',
		height: '28dip',
		right: '8dip',
		backgroundImage: '/images/rightarrow.png',
	});
	
	qnView.add( vws.arrow );
	
	var rightMargin = '32dip';
	
	if ( qn.photoUrls.length > 0 ) {
		vws.photoView = PhotoView.createPhotoView( qn.photoUrls );
		qnView.add( _(vws.photoView.view ).extend( { width: '170dip', right: '30dip' }));
		rightMargin = '232dip';
	}

	vws.qnLabel = Ti.UI.createLabel({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		left: '10dip',
		right: rightMargin,
		text: qn.text,
		font: { font: 'Tahoma', fontSize: Layout.QUESTION_TEXT_SIZE },
		color: 'black'
	});
	qnView.add( vws.qnLabel );

	
	// Clicking anywhere on the View raises the onSelect() event
	qnView.addEventListener( 'click', function(e) {
		e.cancelBubble = true;
		qnViewObj.onSelect( e );
		
	});
	qnView.addEventListener('swipe', function(e){
		if ( e.direction === 'left' ) {
			e.cancelBubble = true;
			qnViewObj.onSelect( e );
		}
	});

	qnViewObj.view = qnView;
	
	return qnViewObj;
};
exports.createQuestionView = createQuestionView;

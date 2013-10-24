/*
 * walta/QuestionView
 *
 * Creates the corresponding view for the question
 * datastructure.
 *  
 */

var _ = require('lib/underscore')._;

var PhotoView = require('ui/PhotoView');
var Layout = require('ui/Layout');

function createQuestionView(  /* Question */ qn ) {
	
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
		qnView.add( _(vws.photoView.view ).extend( { height: '90%', width: Layout.THUMBNAIL_WIDTH, right: '30dip' }));
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
		qnViewObj.onSelect( e );
		e.cancelBubble = true;
	});

	qnViewObj.view = qnView;
	
	return qnViewObj;
};
exports.createQuestionView = createQuestionView;
/*
 * walta/QuestionView
 *
 * Creates the corresponding view for the question
 * datastructure.
 *  
 */

var _ = require('lib/underscore')._;

var PhotoView = require('ui/PhotoView');

function createQuestionView(  /* Question */ qn ) {
	
	var qnViewObj = {
		view: null,					 // The Ti.UI.View for the user interface
		question: qn,                // The Question data object associated with this view
		onSelect: function( e ) {}   // Event called when question is selected.
	};
	
	var qnLabel = Ti.UI.createLabel({
		width: '40%',
		height: Ti.UI.FILL,
		left: '25dip',
		text: qn.text,
		font: { font: 'Tahoma', fontSize: '20dip' },
		color: 'black'
	});
	
	var qnView = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		borderRadius: 45,
		backgroundColor: '#552F61CC',
		layout: 'horizontal'
	});
	
	qnView.add( qnLabel );
	
	if ( qn.photoUrls.length > 0 ) {
		var photoView = _(PhotoView.createPhotoView( qn.photoUrls )).extend( { height: '90%', left: '20dip', right: '16dip' });
		qnView.add( photoView );
	}
	
	var arrow = Ti.UI.createView({
		width: '14dip',
		height: '28dip',
		backgroundImage: '/images/rightarrow.png',
	});
	
	qnView.add( arrow );
	
	// Clicking anywhere on the View raises the onSelect() event
	qnView.addEventListener( 'click', function(e) {
		qnViewObj.onSelect( e );
		e.cancelBubble = true;
	});

	qnViewObj.view = qnView;
	
	return qnViewObj;
};

exports.createQuestionView = createQuestionView;

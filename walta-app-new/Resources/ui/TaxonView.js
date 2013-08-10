/*
 * walta/TaxonView
 *
 * Creates the corresponding view for the Taxon
 * datastructure.
 *  
 */

var _ = require('lib/underscore')._;

var PhotoView = require('ui/PhotoView');
var AnchorBar = require('ui/AnchorBar');
var Layout = require('ui/Layout');

function createDetailsView( txn ) {
	var view= Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		borderRadius: 25,
		backgroundColor: '#552F61CC',
		layout: 'vertical'
	});
	
	view.add(
		Ti.UI.createLabel({
			left: Layout.WHITESPACE_GAP,
			top: Layout.WHITESPACE_GAP,
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE,
			html: txn.asDetailHtml(),
			font: { font: Layout.TEXT_FONT, fontSize: Layout.DETAILS_TEXT_SIZE },
			color: 'black'
		})
	);
	return view;
};

function createActionButton( icon, onClick ) {
	
};

function createActionsView( txnViewObj ) {
	var view = Ti.UI.createView({
		width: Ti.UI.SIZE,
		height: Ti.UI.FILL,
	});
	var photoView = PhotoView.createPhotoView( txnViewObj.taxon.photoUrls );
	view.add( _(photoView).extend( { width: '225dip', top: Layout.WHITESPACE_GAP } ) );
	return view;
};

function createTaxonView(  /* Taxon */ txn ) {
	
	var txnViewObj = {
		view: null,					// The Ti.UI.View for the user interface
		taxon: txn,                // The Question data object associated with this view
		onBack: function( e ) {}   // Event called when back button is selected.
	};
	
	var title = Ti.UI.createLabel({
		width:  Ti.UI.SIZE,
		height: Ti.UI.SIZE,
		top: Layout.WHITESPACE_GAP,
		left: Layout.WHITESPACE_GAP,
		text: txn.getScientificName() + '\n(' + txn.commonName + ')',
		font: { font: Layout.HEADING_FONT, fontSize: Layout.HEADING_SIZE },
		color: '#2F61CC'
	});
	
	var anchor = AnchorBar.createAnchorBar( { title: "ALT Key" } );
	var details = createDetailsView( txn );
	var actions = createActionsView( txnViewObj );
	
	var txnView = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		backgroundColor: 'white',
		layout: 'vertical'
	});
	
	var subView = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		backgroundColor: 'white',
		layout: 'horizontal',
		horizontalWrap: false
	});
	
	
	txnView.add( anchor.view );
	txnView.add( title );
	
	
	subView.add( _(details).extend( { left: Layout.WHITESPACE_GAP, top: Layout.WHITESPACE_GAP, bottom: Layout.WHITESPACE_GAP, width: '55%' } ) );
	subView.add( _(actions).extend( { left: Layout.WHITESPACE_GAP, right: Layout.WHITESPACE_GAP } ) );
	
	txnView.add( subView );

	txnViewObj.view = txnView;
	
	return txnViewObj;
};

exports.createTaxonView = createTaxonView;

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

function createDetailsView( txnViewObj ) {
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
			html: txnViewObj.taxon.asDetailHtml(),
			font: { font: Layout.TEXT_FONT, fontSize: Layout.DETAILS_TEXT_SIZE },
			color: 'black'
		})
	);
	return view;
};

function createActionButton( imageUrl, label, onClick ) {
	
	var btn = Ti.UI.createButton( {
		width: Layout.BUTTON_SIZE,
		height: Layout.BUTTON_SIZE,
		backgroundImage: imageUrl
	} );
	btn.addEventListener( 'click', onClick );
		
	var lbl = Ti.UI.createLabel( { 
		font: { font: Layout.TEXT_FONT, fontSize: Layout.BUTTON_FONT_SIZE },
		text: label,
		color: 'black',
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
	});
	
	var ctn = Ti.UI.createView( {
		width: Layout.BUTTON_SIZE,
		height: Ti.UI.SIZE,
		left: Layout.BUTTON_MARGIN,
		top: Layout.BUTTON_MARGIN,
		right: Layout.BUTTON_MARGIN,
		bottom: Layout.BUTTON_MARGIN,	
		layout: 'vertical'
	});
	
	ctn.add( btn );
	ctn.add( lbl );

	return ctn;
};

function createActionsView( txnViewObj ) {
	var view = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		layout: 'vertical'
	});
	
	var actionView = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		layout: 'horizontal'
	});
	
	// Add the go back button
	actionView.add( createActionButton( "/images/goback.png", "Go back and try again", function(e) {
		txnViewObj.onBack(e);
		e.cancelBubble = true;
	}));
	
	// If there are photos add the photo view and button
	if ( txnViewObj.taxon.photoUrls.length > 0 ) {
		var photoView = PhotoView.createPhotoView( txnViewObj.taxon.photoUrls );
		view.add( _(photoView.view).extend( { left: 0, width: '225dip', top: Layout.WHITESPACE_GAP } ) );
		
		
		actionView.add( createActionButton( "/images/gallery.png", "Photo gallery", function(e) {
			photoView.open();
			e.cancelBubble = true;
		}));
	}
	
	// If there is a video add the video buton
	if ( txnViewObj.taxon.videoUrl !== null ) {
		actionView.add( createActionButton( "/images/video.png", "Watch video", function(e) {
			// open video player
			e.cancelBubble = true;
		}));
	}
	
	view.add( actionView );
	
	return view;
};

function createTaxonView(  /* Taxon */ txn ) {
	
	var txnViewObj = {
		view: null,				   // The Ti.UI.View for the user interface
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
	var details = createDetailsView( txnViewObj );
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

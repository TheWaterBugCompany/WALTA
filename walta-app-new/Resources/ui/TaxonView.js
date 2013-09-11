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

function createDetailsView(txnViewObj) {
	var view = Ti.UI.createView({
		width : Ti.UI.FILL,
		height : Ti.UI.FILL,
		borderRadius : 25,
		backgroundColor : '#552F61CC',
		layout : 'vertical'
	});

	view.add(Ti.UI.createLabel({
		left : Layout.WHITESPACE_GAP,
		top : Layout.WHITESPACE_GAP,
		width : Ti.UI.FILL,
		height : Ti.UI.SIZE,
		html : txnViewObj.taxon.asDetailHtml(),
		font : {
			font : Layout.TEXT_FONT,
			fontSize : Layout.DETAILS_TEXT_SIZE
		},
		color : 'black'
	}));
	return view;
};

function createActionButton(imageUrl, label, onClick) {

	var obj = {
		_views: {},
		view: null
	};
	
	
	var vws = obj._views;
	
	vws.btn = Ti.UI.createButton({
		width : Layout.BUTTON_SIZE,
		height : Layout.BUTTON_SIZE,
		backgroundImage : imageUrl
	});
	vws.btn.addEventListener('click', onClick);

	vws.lbl = Ti.UI.createLabel({
		font : {
			font : Layout.TEXT_FONT,
			fontSize : Layout.BUTTON_FONT_SIZE
		},
		text : label,
		color : 'black',
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER
	});

	var ctn = Ti.UI.createView({
		width : Layout.BUTTON_SIZE,
		height : Ti.UI.SIZE,
		left : Layout.BUTTON_MARGIN,
		top : Layout.BUTTON_MARGIN,
		right : Layout.BUTTON_MARGIN,
		bottom : Layout.BUTTON_MARGIN,
		layout : 'vertical'
	});

	ctn.add(vws.btn);
	ctn.add(vws.lbl);

	obj.view = ctn;

	return obj;
};

function createActionsView(txnViewObj) {

	var vws = txnViewObj._views;

	vws.actions = Ti.UI.createView({
		width : Ti.UI.FILL,
		height : Ti.UI.FILL,
		layout : 'vertical'
	});

	vws.actionBtns = Ti.UI.createView({
		width : Ti.UI.FILL,
		height : Ti.UI.FILL,
		layout : 'horizontal'
	});

	// Add the go back button
	vws.goBack = createActionButton("/images/goback.png", "Go back and try again", function(e) {
		txnViewObj.onBack(e);
		e.cancelBubble = true;
	});
	vws.actionBtns.add(vws.goBack.view);

	// If there are photos add the photo view and button
	if (txnViewObj.taxon.photoUrls.length > 0) {
		vws.photoView = PhotoView.createPhotoView(txnViewObj.taxon.photoUrls);
		vws.actions.add(_(vws.photoView.view).extend({
			left : 0,
			width : '225dip',
			top : Layout.WHITESPACE_GAP
		}));

		vws.openGallery = createActionButton("/images/gallery.png", "Photo gallery", function(e) {
			photoView.open();
			e.cancelBubble = true;
		});
		vws.actionBtns.add(vws.openGallery.view);
	}

	// If there is a video add the video button
	if (txnViewObj.taxon.videoUrl !== null) {
		vws.watchVideo = createActionButton("/images/video.png", "Watch video", function(e) {
			// open video player
			e.cancelBubble = true;
		});
		vws.actionBtns.add(vws.watchVideo.view);
	}

	vws.actions.add(vws.actionBtns);
};

function createTaxonView(/* Taxon */txn) {

	var txnViewObj = {
		_views : {},
		view : null, // The Ti.UI.View for the user interface
		taxon : txn, // The Question data object associated with this view
		onBack : function(e) {
		} // Event called when back button is selected.
	};

	var vws = txnViewObj._views;

	vws.title = Ti.UI.createLabel({
		width : Ti.UI.SIZE,
		height : Ti.UI.SIZE,
		top : Layout.WHITESPACE_GAP,
		left : Layout.WHITESPACE_GAP,
		text : txn.getScientificName() + '\n(' + txn.commonName + ')',
		font : {
			font : Layout.HEADING_FONT,
			fontSize : Layout.HEADING_SIZE
		},
		color : '#2F61CC'
	});

	vws.anchor = AnchorBar.createAnchorBar({
		title : "ALT Key"
	});
	vws.details = createDetailsView(txnViewObj);
	createActionsView(txnViewObj);

	var txnView = Ti.UI.createView({
		width : Ti.UI.FILL,
		height : Ti.UI.FILL,
		backgroundColor : 'white',
		layout : 'vertical'
	});

	vws.subView = Ti.UI.createView({
		width : Ti.UI.FILL,
		height : Ti.UI.FILL,
		backgroundColor : 'white',
		layout : 'horizontal',
		horizontalWrap : false
	});

	txnView.add(vws.anchor.view);
	txnView.add(vws.title);

	vws.subView.add(_(vws.details).extend({
		left : Layout.WHITESPACE_GAP,
		top : Layout.WHITESPACE_GAP,
		bottom : Layout.WHITESPACE_GAP,
		width : '55%'
	}));
	vws.subView.add(_(vws.actions).extend({
		left : Layout.WHITESPACE_GAP,
		right : Layout.WHITESPACE_GAP
	}));

	txnView.add(vws.subView);

	txnViewObj.view = txnView;

	return txnViewObj;
};

exports.createTaxonView = createTaxonView;
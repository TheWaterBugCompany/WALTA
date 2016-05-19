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
 * walta/TaxonView
 *
 * Creates the corresponding view for the Taxon
 * datastructure.
 *
 */

var _ = require('lib/underscore')._;
var Layout = require('ui/Layout');
var Topics = require('ui/Topics');
var PlatformSpecific = require('ui/PlatformSpecific');

function createDetailsView(txnViewObj) {
	var vws = txnViewObj._views;
	
	vws.detailsBox = Ti.UI.createView({
		width : Ti.UI.FILL,
		height : Ti.UI.FILL,
		borderRadius : Layout.BORDER_RADIUS,
		backgroundColor : Layout.COLOR_LIGHT_BLUE,
		layout : 'vertical'
	});

	
	vws.details = Ti.UI.createWebView({
		scalesPageToFit: false,
		disableBounce: true,
		enableZoomControls: false,
		backgroundColor: Layout.COLOR_LIGHT_BLUE,
		width : Ti.UI.FILL,
		height : Ti.UI.FILL,
		left: Layout.WHITESPACE_GAP,
		top: Layout.WHITESPACE_GAP,
		bottom: Layout.WHITESPACE_GAP,
		right: Layout.WHITESPACE_GAP,
		willHandleTouches: false,
		html: '<html><head><meta name="viewport" content="initial-scale=1.0, user-scalable=no"></meta>'
			+ '<style>html,body {margin:0;padding:0;color:black;font-family:' + Layout.TEXT_FONT +';font-size:' + Layout.DETAILS_TEXT_SIZE + ';}</style>'
			+ '</head><body id="details">' + txnViewObj.taxon.asDetailHtml() + '</body></html>'
	});

	vws.detailsBox.add( vws.details );

	/* 
	 * =============== HACK: Workaround for odd WebView resizing bug under iOS ===============
	 * See Trac issue #72
	 * Under iOS the WebView seems to mysteriously change zoom level after the initial layout.
	 * 
	 * To fix this we set the explicit width of the view on the postlayout event to make sure 
	 * it won't change from the value first calculated.
	 */
	
	if ( Ti.Platform.osname === 'iphone' ) {			
		var hackListener = function() {
			vws.details.width = vws.details.size.width;
			vws.details.removeEventListener( 'postlayout', hackListener );
		};
		vws.details.addEventListener( 'postlayout', hackListener );
	}
	
	/*
	 * ============================== END HACK ================================================
	 */

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

	var PhotoView = require('ui/PhotoView');

	var Topics = require('ui/Topics');
	

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

	// If there are photos add the photo view and button
	if (txnViewObj.taxon.photoUrls.length > 0) {
		vws.photoView = PhotoView.createPhotoView(txnViewObj.taxon.photoUrls);
		vws.actions.add(_(vws.photoView.view).extend({
			left : 0,
			width : Layout.THUMBNAIL_WIDTH,
			top : Layout.WHITESPACE_GAP
		}));

		vws.openGallery = createActionButton("/images/icon-gallery.gif", "Photo gallery", function(e) {
			vws.photoView.open();
			e.cancelBubble = true;
		});
		vws.actionBtns.add(vws.openGallery.view);
	}

	// If there is a video add the video button
	if (txnViewObj.taxon.videoUrl) {
		vws.watchVideo = createActionButton("/images/icon-video.gif", "Watch video", function(e) {
			// open video player
			Topics.fireTopicEvent( Topics.VIDEO, { url: txnViewObj.taxon.videoUrl } );
			e.cancelBubble = true;
		});
		vws.actionBtns.add(vws.watchVideo.view);
	}

	vws.actions.add(vws.actionBtns);
};

function createTaxonView(/* Taxon */txn ) {
	var platformHeight = PlatformSpecific.convertSystemToDip( Titanium.Platform.displayCaps.platformHeight );
	var GoBackButton = require('ui/GoBackButton');
	var txnViewObj = {
		_views : {},
		view : null, // The Ti.UI.View for the user interface
		taxon : txn // The Question data object associated with this view
	};

	var vws = txnViewObj._views;

	vws.title = Ti.UI.createLabel({
		width : Ti.UI.SIZE,
		height : Ti.UI.SIZE,
		top : Layout.WHITESPACE_GAP,
		left : Layout.WHITESPACE_GAP,
		text : txn.commonName,
		font : {
			font : Layout.HEADING_FONT,
			fontSize : Layout.HEADING_SIZE
		},
		color : '#2F61CC'
	});

	createDetailsView(txnViewObj);
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
		layout : 'composite',
		horizontalWrap : false
	});

	txnView.add(vws.title);

	vws.subView.add(_(vws.detailsBox).extend({
		left: Layout.WHITESPACE_GAP,
		top: Layout.WHITESPACE_GAP,
		bottom: Layout.WHITESPACE_GAP,
		width: Ti.UI.FILL,
		right: '232dip'
	}));
	vws.subView.add(_(vws.actions).extend({
		width: '208dip',
		right : Layout.WHITESPACE_GAP
	}));

	txnView.add(vws.subView);
	
	txnView.addEventListener('swipe', function(e){
		if ( e.direction === 'right' ) {
			e.cancelBubble = true;
			Topics.fireTopicEvent( Topics.BACK );
		}
	});

	txnViewObj.view = txnView;
	
	_(txnViewObj).extend({
		openingFromMenu: function( args ) {
			if ( args.anchorBar ) {
				var anchorBar = args.anchorBar;
				anchorBar.addTool( GoBackButton.createGoBackButton() );
			}
		}
	});

	return txnViewObj;
};

exports.createTaxonView = createTaxonView;

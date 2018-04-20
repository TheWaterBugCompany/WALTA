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
 * TaxonDetails
 *
 * Displays the details of a Taxon endpoint.
 *
 */

var Layout = require('ui/Layout');
var Topics = require('ui/Topics');
var PhotoView = require('ui/PhotoView');
var PlatformSpecific = require('ui/PlatformSpecific');


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

$.taxon = $.args.taxon;
var platformHeight = PlatformSpecific.convertSystemToDip( Titanium.Platform.displayCaps.platformHeight );
var GoBackButton = require('ui/GoBackButton');

$.title.text = $.taxon.commonName;
$.details.html = `<html><head><meta name="viewport" content="initial-scale=1.0, user-scalable=no"></meta>
<style>html,body {margin:0;padding:0;color:black;font-family:${Layout.TEXT_FONT};font-size:${Layout.DETAILS_TEXT_SIZE};}</style>
</head><body id="details">${$.args.taxon.asDetailHtml()}</body></html>`;

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
		$.details.width = vws.details.size.width;
		$.details.removeEventListener( 'postlayout', hackListener );
	};
	$.details.addEventListener( 'postlayout', hackListener );
}

/*
 * ============================== END HACK ================================================
 */

// If tere are photos add the photo view and button
if ($.args.taxon.photoUrls.length > 0) {
	var photoView = PhotoView.createPhotoView($.taxon.photoUrls);
	$.photoView.add(_(photoView.view).extend({
		left : 0,
		width : Layout.THUMBNAIL_WIDTH,
		top : Layout.WHITESPACE_GAP
	}));

	$.openGallery = createActionButton("/images/icon-gallery.png", "Photo gallery", function(e) {
		photoView.open();
		e.cancelBubble = true;
	});
	$.actionBtns.add( $.openGallery.view );
}

// If there is a video add the video button
if ($.args.taxon.videoUrl) {
	var watchVideo = createActionButton("/images/icon-video.png", "Watch video", function(e) {
		// open video player
		Topics.fireTopicEvent( Topics.VIDEO, { url: $.args.taxon.videoUrl } );
		e.cancelBubble = true;
	});
	$.actionBtns.add(watchVideo.view);
}

function swipeListener(e){
	if ( e.direction === 'right' ) {
		e.cancelBubble = true;
		Topics.fireTopicEvent( Topics.BACK );
	}
}

$.TaxonDetails.addEventListener('swipe', swipeListener);


function cleanup() {
  $.TaxonDetails.removeEventListener('swipe', swipeListener);
}

var windowController = Alloy.createController("TopLevelWindow", {
  name: 'decision',
  title: 'ALT Key',
  uiObj: {view: $.getView() },
  slide: $.args.slide,
	onOpen: $.args.onOpen,
  cleanup: cleanup
} );

windowController
	 .getAnchorBar()
   .addTool( GoBackButton.createGoBackButton() );

exports.getWindow = windowController.getView;

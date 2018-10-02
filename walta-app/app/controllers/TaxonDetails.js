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

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "ALT Key";
$.name = "decision";

function createActionButton(imageUrl, label, onClick) {
	var obj = {
		_views: {},
		view: null
	};
	var vws = obj._views;
	vws.btn = Ti.UI.createButton({
		width : Layout.BUTTON_SIZE,
		height : Layout.BUTTON_SIZE,
		backgroundImage : imageUrl,
		accessibilityLabel: `${label} Button`
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

	return ctn;
};

$.taxon = $.args.taxon;
var platformHeight = PlatformSpecific.convertSystemToDip( Titanium.Platform.displayCaps.platformHeight );
var GoBackButton = require('ui/GoBackButton');

$.title.text = $.taxon.commonName;
$.details.html = `<html><head><meta name="viewport" content="initial-scale=1.0, user-scalable=no"></meta>
<style>html,body {margin:0;padding:0;color:black;font-family:${Layout.TEXT_FONT};font-size:${Layout.DETAILS_TEXT_SIZE};}</style>
</head><body id="details">${$.args.taxon.asDetailHtml()}</body></html>`;

// If tere are photos add the photo view and button
if ($.args.taxon.photoUrls.length > 0) {
	$.photoView = PhotoView.createPhotoView($.taxon.photoUrls);
	$.photoViewCtn.add(_($.photoView.view).extend({
		left : 0,
		width : Layout.THUMBNAIL_WIDTH,
		top : Layout.WHITESPACE_GAP
	}));

	$.actionBtns.add(
		createActionButton("/images/gallery-icon.png", "Photo gallery",
			function(e) {
				$.photoView.open();
				e.cancelBubble = true;
			}));
}

// If there is a video add the video button
if ($.args.taxon.videoUrl) {
	$.actionBtns.add(
		createActionButton("/images/icon-video.png", "Watch video",
			function(e) {
				// open video player
				Topics.fireTopicEvent( Topics.VIDEO, { url: $.taxon.videoUrl } );
				e.cancelBubble = true;
			}) );
}

// Add the add to sample button
$.actionBtns.add(
	createActionButton("/images/plus-icon.png", "Add To Sample",
		function(e) {
			Topics.fireTopicEvent( Topics.IDENTIFY, { taxonId: $.taxon.taxonId } );
			e.cancelBubble = true;
		}) );

function swipeListener(e){
	if ( e.direction === 'right' ) {
		e.cancelBubble = true;
		Topics.fireTopicEvent( Topics.BACK, $.name  );
	}
}

$.content.addEventListener('swipe', swipeListener);


$.getView().addEventListener( "close", function cleanup() {
  $.content.removeEventListener('swipe', swipeListener);
  $.content.removeEventListener('swipe', cleanup);
});

$.getAnchorBar()
 .addTool( GoBackButton.createGoBackButton() );

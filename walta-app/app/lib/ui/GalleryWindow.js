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
 * Module: GalleryWindow
 *
 * Shows a thumbnail of a list of photos, then if the zoom icon is pressed
 * opens a modal view displaying a gallery of all the images.
 *
 */
var _ = require('lib/underscore')._;

var Layout = require('ui/Layout');
var Topics = require('ui/Topics');
var { urlToLocalAsset } = require("ui/PlatformSpecific");

// Create a dot view
function createDot() {
	var dot = Ti.UI.createView( {
		backgroundImage: '/images/dot.png',
		width: Layout.PAGER_DOT_SIZE,
		height: Layout.PAGER_DOT_SIZE,
		left: Layout.WHITESPACE_GAP,
		bottom: '2dip',
		opacity: 0.5} );
	return dot;
}

// Update current page
function updateCurrentPage( dots, selPage ) {
	for( var i = 0; i < dots.length; i++ ) {
		dots[i].setOpacity( selPage === i ? 1.0 : 0.5 );
	}
}

function createGalleryWindow(photoUrls, showPager ) {
	if ( _.isUndefined( showPager ) ) showPager = true;

	var galleryWin = Ti.UI.createWindow({
			accessibilityLabel: 'photo_gallery',
			backgroundColor: 'black',
			navBarHidden: true,
			fullscreen: true
	});

	var scrollView = Ti.UI.createScrollableView({
		views: _(photoUrls).map(
			function(url) {
				var view = null;

				// NOTE: ScrollView; iPhone has zoom, Android doesn't, another inconsistency in Titanium API.
				// we cheat by using a WebView.
				var params = {
					setScalesPageToFit: false,
					disableBounce: true,
					enableZoomControls: true,
					backgroundColor: 'transparent',
					width : Ti.UI.FILL,
					height : Ti.UI.FILL,
					html: '<html><head><meta name="viewport" content="initial-scale=1.0, user-scalable=yes, maximum-scale=6.0, minimum-scale=1.0, width=device-width, height=device-height, target-densitydpi=device-dpi"></meta><style>html,body { position: absolute; top:0; bottom: 0; background-color: black; margin-left: auto; margin-right: auto; margin: 0; padding: 0; border: 0 } ::-webkit-scrollbar { display: none;} img { display: block; margin-left:auto;margin-right:auto; padding:0; width:100%; }</style></head><body><img src="' + urlToLocalAsset(url) + '"></body></html>'
				};
				if ( OS_ANDROID ) 
					params.cacheMode = Ti.UI.Android.WEBVIEW_LOAD_NO_CACHE;
				if ( OS_IOS )
					params.cachPolicy = Ti.UI.iOS.CACHE_POLICY_IGNORING_LOCAL_CACHE_DATA;

				view =  Ti.UI.createWebView(params);
				return view;
			}),
		showPagingControl: false,
		bottom: ( showPager ? Layout.PAGER_HEIGHT : 0 )
	});
	galleryWin.add(scrollView);

	function scrollEvent(e) {
		if ( e.currentPage !== lastPage ) {
			updateCurrentPage( dots, e.currentPage );
			lastPage = e.currentPage;
		}
	}

	if ( showPager ) {
		var pager = Ti.UI.createView({
			width: Ti.UI.SIZE,
			height: Layout.PAGER_HEIGHT,
			backgroundColor: 'black',
			bottom: 0,
			layout: 'horizontal',
			horizontalWrap: 'false'
		});

		var dots = [];
		_(photoUrls).each( function() {
			var dot = createDot();
			dots.push( dot );
			pager.add( dot );
		});
		galleryWin.add( pager );

		var lastPage = scrollView.getCurrentPage();
		updateCurrentPage( dots, lastPage );

		scrollView.addEventListener( 'scroll',scrollEvent);
	}
	galleryWin.closeButton = Ti.UI.createView({
		width: Layout.FULLSCREEN_CLOSE_BUTTON_BUFFER,
		height: Layout.FULLSCREEN_CLOSE_BUTTON_BUFFER,
		top: 0,
		right: 0
	});

	galleryWin.closeButton.add( Ti.UI.createImageView({
		image: '/images/delete-icon-blue.png',
		width: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE,
		height: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE,
		top: Layout.WHITESPACE_GAP,
		right: Layout.WHITESPACE_GAP
	}));

	function closeEvent(e) {
		galleryWin.close();
	}
	galleryWin.closeButton.addEventListener( 'click', closeEvent);

	galleryWin.add( galleryWin.closeButton );

	galleryWin.addEventListener( 'close', function cleanUp(e) {
		galleryWin.closeButton.removeEventListener( 'click', closeEvent);
		scrollView.removeEventListener( 'scroll', scrollEvent);
		galleryWin.removeEventListener( 'close', cleanUp);
	});
	return galleryWin;
}

exports.createGalleryWindow = createGalleryWindow;

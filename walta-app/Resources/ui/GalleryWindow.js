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

var Layout = require('ui/Layout');

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
	var _ = require('lib/underscore')._;
	var TiHacks = require('util/TiHacks');
	
	if ( _.isUndefined( showPager ) ) showPager = true;
	
	var galleryWin = Ti.UI.createWindow({ 
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
				if ( Ti.Platform.osname === 'android' ) {
					
					view =  Ti.UI.createWebView({
						setScalesPageToFit: false,
						disableBounce: true,
						enableZoomControls: true,
						backgroundColor: 'transparent',
						width : Ti.UI.FILL,
						height : Ti.UI.FILL,
						html: '<html><head><meta name="viewport" content="initial-scale=1.0, user-scalable=yes"></meta><style>html,body { width: 100%; background-color: black; margin: 0; padding: 0; border: 0 } img { display: block; margin-left:auto;margin-right:auto; padding:0; height:100%;}</style></head><body><img src="' + TiHacks.convertTiUrlToWebViewUrl(url) + '"></body></html>'
					});
					
			   	} else {
			   		view = Ti.UI.createScrollView({
						minZoomScale: 0.5,
						maxZoomScale: 4.0,
						zoomScale: 0.5
					});
					view.add( Ti.UI.createImageView( { image: url } ) );
			   	}
				return view; 
			}),
		showPagingControl: false,
		bottom: ( showPager ? Layout.PAGER_HEIGHT : 0 )
	}); 
	galleryWin.add(scrollView);
	galleryWin._views = [];
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
		
		scrollView.addEventListener( 'scroll', function(e) {
			if ( e.currentPage !== lastPage ) {
				updateCurrentPage( dots, e.currentPage );
				lastPage = e.currentPage;
			}
		});
	}
	
	var close = Ti.UI.createView({
		width: Layout.FULLSCREEN_CLOSE_BUTTON_BUFFER,
		height: Layout.FULLSCREEN_CLOSE_BUTTON_BUFFER,
		top: 0,
		right: 0
	});
	
	close.add( Ti.UI.createImageView({
		image: '/images/close.png',
		width: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE,
		height: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE,
		top: Layout.WHITESPACE_GAP,
		right: Layout.WHITESPACE_GAP
	}));
	
		
	close.addEventListener( 'click', function(e) {
		galleryWin.close();
		e.cancelBubble = true;
	});
	
	galleryWin.add( close );

	// testing hooks
	galleryWin._views = { close: close };
	
	return galleryWin;
}

exports.createGalleryWindow = createGalleryWindow;

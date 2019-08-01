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
 * Conttoller: Gallery
 *
 * Shows a thumbnail of a list of photos, then if the zoom icon is pressed
 * opens a modal view displaying a gallery of all the images.
 *
 */
var { makeAccessibilityLabel } = require('ui/ViewUtils');
exports.baseController  = "TopLevelWindow";
$.name = "gallery";

var Layout = require('ui/Layout');
var { urlToLocalAsset } = require("ui/PlatformSpecific");

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.views.forEach( (v) => v.release() );
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});

var key = $.args.key;
var photos = $.args.photos;
var showPager = $.args.showPager;
if ( _.isUndefined( showPager ) ) showPager = true;

if ( !photos && key )
    photos = _.first( _.shuffle( key.findAllMedia('photoUrls') ), 20 );
console.info(JSON.stringify(photos));
$.views = _(photos).map( (url) => {
        // NOTE: ScrollView; iPhone has zoom, Android doesn't, another inconsistency in Titanium API.
        // we cheat by using a WebView.
        var params = {
            setScalesPageToFit: false,
            disableBounce: true,
            enableZoomControls: true,
            backgroundColor: 'transparent',
            width : Ti.UI.FILL,
            height : Ti.UI.FILL,
            html: '<html><head><meta name="viewport" content="initial-scale=1.0, user-scalable=yes, maximum-scale=6.0, minimum-scale=1.0, width=device-width, height=device-height, target-densitydpi=device-dpi"></meta><style>html,body { margin: 0; } ::-webkit-scrollbar { display: none;} img { display: block; width:100%; }</style></head><body><img src="' + urlToLocalAsset(url) + '"></body></html>'
        };
        if ( OS_ANDROID ) 
            params.cacheMode = Ti.UI.Android.WEBVIEW_LOAD_NO_CACHE;
        if ( OS_IOS )
            params.cachPolicy = Ti.UI.iOS.CACHE_POLICY_IGNORING_LOCAL_CACHE_DATA;
        return Ti.UI.createWebView(params);
    });

$.views.forEach( (v) => $.scrollView.addView(v) );
$.scrollView.bottom = ( showPager ? Layout.PAGER_HEIGHT : 0 );

// Create a dot view
function createDot(i) {
	var dot = Ti.UI.createView( {
        accessibilityLabel: makeAccessibilityLabel('photo_gallery_page', i ),
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
function scrollEvent(e) {
    if ( e.currentPage !== lastPage && dots ) {
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
    _(photos).each( function(p,i) {
        var dot = createDot(i);
        dots.push( dot );
        pager.add( dot );
    });
    $.content.add( pager );

    var lastPage = $.scrollView.getCurrentPage();
    updateCurrentPage( dots, lastPage );
}

function closeEvent(e) {
    $.TopLevelWindow.close();
}
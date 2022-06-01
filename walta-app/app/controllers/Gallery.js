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
var Crashlytics = require('util/Crashlytics');
var log = Crashlytics.log;
/*
 * Controller: Gallery
 *
 * Shows a thumbnail of a list of photos, then if the zoom icon is pressed
 * opens a modal view displaying a gallery of all the images.
 *
 */
var Topics = require('ui/Topics');
exports.baseController  = "TopLevelWindow";
$.name = "gallery";
var Topics = require('ui/Topics');
var Layout = require('ui/Layout');

$.TopLevelWindow.useUnSafeArea = true;
$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.TopLevelWindow.removeEventListener('close', cleanUp );
});

var key = $.args.key;
var photos = $.args.photos;
var showPager = $.args.showPager;
var startPhotoIndex = 0;
var allPhotos;
if ( _.isUndefined( showPager ) ) showPager = true;

log(`Photo gallery pased photos: ${JSON.stringify(photos)}`);
if ( !photos && key ) {
    allPhotos = _.shuffle( key.findAllMedia('photoUrls') );
    photos = allPhotos.slice(0,5);
}


function buildPhotoView(urlObj) {
    /* urlObj can be a string or an object with the shape:
]   {
        url: "...." # url string
        taxon: "...." # taxon or question object

    }*/
    var imageUrl;
    if ( typeof(urlObj) == "object" ) {
        Ti.API.info(`taxon = ${urlObj.taxon.taxonId}`)
        imageUrl=urlObj.url;

    } else {
        imageUrl=urlObj;
    }
    console.log(`creating tile for url = ${imageUrl}`);
    var needsPostLayout = !$.scrollView.size.height;
    var container = Ti.UI.createView({
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE
    });
    var imageView = Ti.UI.createImageView({ 
        enableZoomControls: true, 
        image: imageUrl, 
        height: Ti.UI.FILL
    } );
    container.add(imageView);

    if ( typeof(urlObj) == "object") {
        
        var label = Ti.UI.createLabel({ 
                color: "white",
                font: { fontSize:"20dp" },
                shadowColor: '#000',
                shadowOffset: {x:"5", y:"5"},
                shadowRadius: "3dp",
                text: urlObj.taxon.name, 
                width: Ti.UI.SIZE, 
                height: Ti.UI.SIZE,
                top: "50dp"
            });
        label.addEventListener("click", function() {
            Topics.fireTopicEvent(Topics.JUMPTO,{id: urlObj.taxon.id});
        });
        
        
        container.add(label);
    } 
   
    imageView.addEventListener("postlayout", function setSize() {
        imageView.height = $.scrollView.size.height;
    });
    container.addEventListener("close", function cleanUpImageView() {
        imageView.removeEventListener("postlayout", setSize);
        imageView.removeEventListener("close", cleanUpImageView);
    });
    if ( OS_IOS ) {
        var zoomable = Ti.UI.createScrollView( { disableBounce: true, maxZoomScale: 10.0, minZoomScale: 1.0, width: Ti.UI.FILL, height: Ti.UI.FILL });
        zoomable.add( container );
        return zoomable;
    } else {
        return container;
    }
}

function updatePhotoView() {
    const LIMIT_VIEWS_SIZE_TO=20;
    var page = $.scrollView.currentPage;
    var total = $.scrollView.views.length;
    
    Ti.API.info(`scroll page = ${page} total = ${total}`)
    if ( page+1 == total && (startPhotoIndex+$.scrollView.views.length) < (allPhotos.length - 5)) {
        startPhotoIndex=startPhotoIndex+5;
        var newViews = allPhotos.slice(startPhotoIndex+$.scrollView.views.length, startPhotoIndex+$.scrollView.views.length+5)
            .map( p => buildPhotoView(p) ) 
        $.scrollView.insertViewsAt(total,newViews);
        if ( $.scrollView.views.length > LIMIT_VIEWS_SIZE_TO) {
            var extra = $.scrollView.views.length-LIMIT_VIEWS_SIZE_TO;
            for(var i = 0; i<extra; i++)
                $.scrollView.removeView($.scrollView.views[0]);
            $.scrollView.currentPage = page - extra;
        }
    } else if ( page == 0 && startPhotoIndex > 5) {
        startPhotoIndex=startPhotoIndex-5;
        var newViews = allPhotos.slice(startPhotoIndex, startPhotoIndex+5)
            .map( p => buildPhotoView(p) )
        $.scrollView.insertViewsAt(0,newViews);
        if ( $.scrollView.views.length > LIMIT_VIEWS_SIZE_TO) {
            var extra = $.scrollView.views.length-LIMIT_VIEWS_SIZE_TO;
            for(var i = 0; i<extra; i++) {
                $.scrollView.removeView($.scrollView.views[$.scrollView.views.length-1]);
            }
        }
        $.scrollView.currentPage = page + newViews.length;
    }
    
}
photos.forEach( (url => {
    var view = buildPhotoView(url)
    $.scrollView.addView(view);
}));

$.scrollView.bottom = ( showPager && photos.length > 1 ? Layout.PAGER_HEIGHT : 0 );

// Create a dot view
function createDot(i) {
	var dot = Ti.UI.createView( {
        accessibilityLabel: `Jump To Photo ${i}`,
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
    $.scrollView.accessibilityLabel = `Photo ${selPage+1}`;
	for( var i = 0; i < dots.length; i++ ) {
		dots[i].opacity = ( selPage === i ? 1.0 : 0.5 );
	}
}
function scrollEvent(e) {
    if (allPhotos)
        updatePhotoView();
    if ( e.currentPage !== lastPage && dots ) {
        updateCurrentPage( dots, e.currentPage );
        lastPage = e.currentPage;
    }
}

if ( showPager && photos.length > 1 ) {
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

    var lastPage = $.scrollView.currentPage;
    updateCurrentPage( dots, lastPage );
}

function closeEvent(e) {
    Topics.fireTopicEvent( Topics.BACK );
    e.cancelBubble = true;
}

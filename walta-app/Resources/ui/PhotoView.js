/*
 * Module: PhotoView
 * 
 * Shows a thumbnail of a list of photos, then if the zoom icon is pressed
 * opens a modal view displaying a gallery of all the images.
 * 
 */

var _ = require('lib/underscore')._;
var Layout = require('ui/Layout');

// Create a dot view
function createDot() {
	var dot = Ti.UI.createView( { 
		backgroundImage: '/images/dot.png', 
		width: '12dip',
		height: '12dip',
		left: Layout.WHITESPACE_GAP,
		bottom: Layout.BUTTON_MARGIN,
		opacity: 0.5} );
	return dot;
} 

// Update current page
function updateCurrentPage( dots, selPage ) {
	for( var i = 0; i < dots.length; i++ ) {
		dots[i].setOpacity( selPage === i ? 1.0 : 0.5 );
	}	
}

// Create photo View
function createPhotoView( photoUrls ) {
	
	var photoViewObj = { _views: {} }; 
	
	
	
	photoViewObj.open = function() { 
		
			/* 
	 		 * To avoid this causing a crash we re-create the Window whenever it is opened, it appears
	 		 * that once the galleryWin is closed that it cannot be re-opened.
	 		 * 
	 		 **/
		
			photoViewObj._views.galleryWin = Ti.UI.createWindow({ 
					backgroundColor: 'black', 
					navBarHidden: true,
					fullscreen: true
			});
		
			photoViewObj._views.scrollView = Ti.UI.createScrollableView({
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
							html: '<html><head><meta name="viewport" content="initial-scale=1.0, user-scalable=yes"></meta><style>html,body,img {margin:0;padding:0;width:100%;height:100%;}</style></head><body><img src="' + url + '"></body></html>'
						});
						
				   	} else {
				   		view = Ti.UI.createScrollView({
							minZoomScale: 1.0,
							maxZoomScale: 4.0
						});
						view.add( Ti.UI.createImageView( { image: url } ) );
				   	}
					return view; 
				}),
			showPagingControl: false,
			bottom: Layout.PAGER_HEIGHT
		}); 
		photoViewObj._views.galleryWin.add(photoViewObj._views.scrollView);
	
		photoViewObj._views.pager = Ti.UI.createView({
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
			photoViewObj._views.pager.add( dot );
		});
		photoViewObj._views.galleryWin.add( photoViewObj._views.pager );
		
		var lastPage = photoViewObj._views.scrollView.getCurrentPage();
		updateCurrentPage( dots, lastPage );
		
		photoViewObj._views.scrollView.addEventListener( 'scroll', function(e) {
			if ( e.currentPage !== lastPage ) {
				updateCurrentPage( dots, e.currentPage );
				lastPage = e.currentPage;
			}
		});
		
		photoViewObj._views.close = Ti.UI.createView({
			width: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE,
			height: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE,
			backgroundImage: '/images/close.png',
			top: Layout.WHITESPACE_GAP,
			right: Layout.WHITESPACE_GAP
		});
		
		photoViewObj._views.galleryWin.add( photoViewObj._views.close );
		
		photoViewObj._views.close.addEventListener( 'click', function(e) {
			photoViewObj._views.galleryWin.close();
			e.cancelBubble = true;
		});
		
		photoViewObj._views.galleryWin.open(); 
		
	};
	
	
	
	// Embedded view
	photoViewObj.view = Ti.UI.createView({
		width: Ti.UI.SIZE,
		height: Ti.UI.SIZE
	});
	
	photoViewObj._views.photo = Ti.UI.createImageView( { 
		image: photoUrls[0],
	});
	
	photoViewObj._views.zoomIcon = Ti.UI.createView( {
		bottom: 0,
		right: 0,
		backgroundImage: '/images/zoom.png',
		width: '30dip',
		height: '30dip'
	});
	photoViewObj.view.add( photoViewObj._views.photo );
	photoViewObj.view.add( photoViewObj._views.zoomIcon );
	photoViewObj._views.zoomIcon.addEventListener( 'click',
		function(e) {
			photoViewObj.open();	
			e.cancelBubble = true;
		});
	
	
	return photoViewObj;
};

exports.createPhotoView = createPhotoView;

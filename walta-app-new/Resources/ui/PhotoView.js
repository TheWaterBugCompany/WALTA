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
		width: Layout.PAGER_HEIGHT - Layout.BUTTON_MARGIN*2, 
		height: Layout.PAGER_HEIGHT  - Layout.BUTTON_MARGIN*2,
		left: Layout.WHITESPACE_GAP,
		bottom: Layout.BUTTON_MARGIN,
		opacity: 0.5 } );
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
	
	var galleryWin = Ti.UI.createWindow({ 
			backgroundColor: 'black', 
			navBarHidden: true,
			fullscreen: true 
	});
	var scrollView = Ti.UI.createScrollableView({
		views: _(photoUrls).map( 
			function(url) { 
				var view = Ti.UI.createView({});
				view.add( Ti.UI.createImageView( { image: url, top: '3%', bottom: '3%', left: '3%', right: '3%' } ) );
				return view; 
			}),
		showPagingControl: false,
		bottom: Layout.PAGER_HEIGHT
	});
	galleryWin.add(scrollView);

	var pager = Ti.UI.createView({
		width: Ti.UI.SIZE,
		height: Layout.PAGER_HEIGHT,
		backgroundColor: 'black',
		bottom: 0,
		layout: 'horizontal',
		horizontalWrap: 'false'
	})
	galleryWin.add(pager);

	
	var dots = [];
	_(photoUrls).each( function() {
		var dot = createDot();
		dots.push( dot )
		pager.add( dot );
	});
	
	var lastPage = scrollView.getCurrentPage();
	updateCurrentPage( dots, lastPage );
	
	scrollView.addEventListener( 'scroll', function(e) {
		if ( e.currentPage !== lastPage ) {
			updateCurrentPage( dots, e.currentPage );
			lastPage = e.currentPage;
		}
	});
	
	var close = Ti.UI.createView({
		width: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE,
		height: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE,
		backgroundImage: '/images/close.png',
		top: Layout.WHITESPACE_GAP,
		right: Layout.WHITESPACE_GAP
	})
	galleryWin.add(close);
	
	close.addEventListener( 'click', function(e) {
		galleryWin.close();
		e.cancelBubble = true;
	});
	
	// Embedded view
	var vw = Ti.UI.createView({
		width: Ti.UI.SIZE,
		height: Ti.UI.SIZE
	});
	
	var photo = Ti.UI.createImageView( { 
		image: photoUrls[0],
	});
	
	var zoomIcon = Ti.UI.createView( {
		bottom: 0,
		right: 0,
		backgroundImage: '/images/zoom.png',
		width: '50dip',
		height: '50dip'
	});
	vw.add( photo );
	vw.add( zoomIcon );
	zoomIcon.addEventListener( 'click',
		function(e) {
			galleryWin.open();	
			e.cancelBubble = true;
		});
	
	var photoViewObj = {
		view: vw,
		open: function() {
			galleryWin.open();
		}
	};
	return photoViewObj;
};

exports.createPhotoView = createPhotoView;
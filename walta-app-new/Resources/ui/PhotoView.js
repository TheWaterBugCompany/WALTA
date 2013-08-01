/*
 * Module: PhotoView
 * 
 * Shows a thumbnail of a list of photos, then if the zoom icon is pressed
 * opens a modal view displaying a gallery of all the images.
 * 
 */

var _ = require('lib/underscore')._;
var PubSub = require('lib/pubsub');

// Create a dot view
function createDot() {
	var dot = Ti.UI.createView( { 
		backgroundImage: '/images/dot.png', 
		width: '8dip', 
		height: '8dip',
		left: '8dip',
		bottom: '2dip',
		opacity: 0.5 } );
	return dot;
} 

// Update current page
function updateCurrentPage( dots, selPage ) {
	for( var i = 0; i < dots.length; i++ ) {
		dots[i].setOpacity( selPage === i ? 1.0 : 0.5 );
	}	
}

// Create an anchor bar View
function createPhotoView( args ) {
	
	var photoView = _(args || {} ).defaults({
		photoUrls: []
	});
	
	var galleryWin = Ti.UI.createWindow({ 
			backgroundColor: 'black', 
			navBarHidden: true,
			fullscreen: true 
	});
	var scrollView = Ti.UI.createScrollableView({
		views: _(photoView.photoUrls).map( 
			function(url) { 
				var view = Ti.UI.createView({});
				view.add( Ti.UI.createImageView( { image: url, top: '3%', bottom: '3%', left: '3%', right: '3%' } ) );
				return view; 
			}),
		showPagingControl: true,
		bottom: '12dip'
	});
	galleryWin.add(scrollView);
	
	var pager = Ti.UI.createView({
		width: Ti.UI.SIZE,
		height: '12dip',
		backgroundColor: 'black',
		bottom: 0,
		layout: 'horizontal',
		horizontalWrap: 'false'
	})
	galleryWin.add(pager);
	
	var dots = [];
	_(photoView.photoUrls).each( function() {
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
		width: '14dip',
		height: '14dip',
		backgroundImage: '/images/close.png',
		top: '8dip',
		right: '8dip'
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
		image: photoView.photoUrls[0],
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
	
	photoView.view = vw;
	return photoView;
};

exports.createPhotoView = createPhotoView;
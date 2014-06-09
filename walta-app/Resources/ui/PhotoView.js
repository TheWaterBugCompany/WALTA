/*
 * Module: PhotoView
 * 
 * Shows a thumbnail of a list of photos, then if the zoom icon is pressed
 * opens a modal view displaying a gallery of all the images.
 * 
 */

// Create photo View
function createPhotoView( photoUrls ) {
	var GalleryWindow = require('ui/GalleryWindow');
	var Layout = require('ui/Layout');

	var photoViewObj = {}; 
	
	// Hooks for auto tests
	photoViewObj.onGalleryWinOpened = function( win ) {};
	photoViewObj.onGalleryWinClosed = function( win ) {};

	photoViewObj.open = function() { 
		var galleryWin = GalleryWindow.createGalleryWindow(photoUrls);
		galleryWin.addEventListener( 'open', function() { 
				photoViewObj.onGalleryWinOpened(galleryWin); // call hook	
		} );
		galleryWin.addEventListener( 'close', function() { 
				photoViewObj.onGalleryWinClosed(galleryWin); // call hook	
		} );
		galleryWin.open(); 
		
	};

	// Embedded view
	photoViewObj.view = Ti.UI.createView({
		width: Ti.UI.SIZE,
		height: Ti.UI.SIZE,
		layout: 'composite'
	});
	
	var photo = Ti.UI.createImageView( { 
		image: photoUrls[0],
		width: Layout.THUMBNAIL_IMAGE_WIDTH,
		top: 0,
		right: 0
	});
	
	var zoomIcon = Ti.UI.createView( {
		bottom: 0,
		right: 0,
		backgroundImage: '/images/zoom.png',
		width: '30dip',
		height: '30dip'
	});
	photoViewObj.view.add( photo );
	photoViewObj.view.add( zoomIcon );
	
	var openGallery = function(e) {
		e.cancelBubble = true;
		photoViewObj.open();		
	};
	photo.addEventListener( 'click', openGallery );
	zoomIcon.addEventListener( 'click', openGallery );
	
	photoViewObj._views = { photo: photo, zoomIcon: zoomIcon };
	
	return photoViewObj;
};

exports.createPhotoView = createPhotoView;

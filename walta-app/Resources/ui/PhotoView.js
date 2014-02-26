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

	var photoViewObj = {}; 

	photoViewObj.open = function() { 
		var galleryWin = GalleryWindow.createGalleryWindow(photoUrls);
		galleryWin.open(); 
	};

	// Embedded view
	photoViewObj.view = Ti.UI.createView({
		width: Ti.UI.SIZE,
		height: Ti.UI.SIZE
	});
	
	var photo = Ti.UI.createImageView( { 
		image: photoUrls[0],
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
	zoomIcon.addEventListener( 'click',
		function(e) {
			photoViewObj.open();	
			e.cancelBubble = true;
		});
	
	photoViewObj._views = { photo: photo, zoomIcon: zoomIcon };
	
	return photoViewObj;
};

exports.createPhotoView = createPhotoView;

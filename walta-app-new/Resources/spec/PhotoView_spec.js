var TestUtils = require('util/TestUtils');

var PhotoView = require('ui/PhotoView');
var TestUtils = require('util/TestUtils');

describe('PhotoView', function() {
	var win, vw, pv;
	
	pv = PhotoView.createPhotoView([ 
			'/spec/resources/simpleKey1/media/amphipoda_01.jpg',
			'/spec/resources/simpleKey1/media/amphipoda_02.jpg',
			'/spec/resources/simpleKey1/media/amphipoda_03.jpg'
		]);
	win = Ti.UI.createWindow( { 
		backgroundColor: 'white', 
		orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] } 
	);
	vw = Ti.UI.createView( { width: '300dip', height: '250dip' });
	vw.add( pv.view );
	win.add( vw );

	it('should display the photo view thumbnail', function() {
		TestUtils.windowOpenTest( win ); 
	});
	
	TestUtils.closeWindow( win );
});

var PhotoView = require('ui/PhotoView');

describe('PhotoView', function() {
	var win, vw, pv;
	
	beforeEach(function() {
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
	});
	
	afterEach(function(){
		win.close();
	});

	it('should display the photo view thumbnail', function() {
		var openCalled = false;		
		runs(function() {		
			win.addEventListener( 'open', function(e) { openCalled = true; } );
			win.open();
		});
		
		waitsFor(function() {
			return openCalled;
		}, "Window to open", 750 );
		
		runs(function() {
			expect( openCalled, true );
		});
	});
});

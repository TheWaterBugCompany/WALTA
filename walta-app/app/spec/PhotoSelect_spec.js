require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, waitForTick, waitForEvent, closeWindow, windowOpenTest, checkTestResult } = require('spec/util/TestUtils');
var { simulatePhotoCapture } = require("spec/mocks/MockCamera");

describe('PhotoSelect controller', function() { 
	var win, vw, pv;
	function makePhotoSelect( readonly, images ) {
		pv = Alloy.createController("PhotoSelect", {readonly: readonly, image: images, cropPhoto: true});
		win = wrapViewInWindow(  _(pv.getView()).extend( { height: '100%', width: '100%' } ) );
		win.addEventListener("close", function cleanUp() {
			win.removeEventListener( "close", cleanUp );
			win = null;
			pv.cleanUp();
			pv = null;
		});
	}

	afterEach( function(done) {
		closeWindow( win, done );
	});

	/*it("should resize image", function(done) { 
		makePhotoSelect( true, '/spec/resources/site-mock.jpg' );
		pv.on("loaded", () => checkTestResult( done, () => {
			var photo = Ti.Filesystem.getFile(pv.photo.image).read();
			expect( photo.width ).to.be.at.most( 1600 );
            expect( photo.height ).to.be.at.most( 1200 );
		}) );
		windowOpenTest( win );
	});*/

	it("should display readonly view", function( done ) { 
		makePhotoSelect( true, [
			'/spec/resources/simpleKey1/media/amphipoda_01.jpg',
			'/spec/resources/simpleKey1/media/amphipoda_02.jpg',
			'/spec/resources/simpleKey1/media/amphipoda_03.jpg'
		]);
		pv.on("loaded", () => checkTestResult( done, () => {
			expect( pv.magnify.visible ).to.be.true;
			expect( pv.camera.visible ).to.be.false;
			expect( pv.photoSelectOptionalLabel.visible ).to.be.false;
			expect( pv.photoSelectLabel.visible ).to.be.false;
			expect( pv.getThumbnailImageUrl() ).to.include("preview_thumbnail");
		}) );
		windowOpenTest( win );
	});

	it("should dynamically enable readonly mode", function( done ) { 
		makePhotoSelect( false, [
			'/spec/resources/simpleKey1/media/amphipoda_01.jpg',
			'/spec/resources/simpleKey1/media/amphipoda_02.jpg',
			'/spec/resources/simpleKey1/media/amphipoda_03.jpg'
		]);
		pv.on("loaded", () => checkTestResult( done, () => {
			expect( pv.magnify.visible ).to.be.true;
			expect( pv.camera.visible ).to.be.true;
			expect( pv.photoSelectOptionalLabel.visible ).to.be.false;
			expect( pv.photoSelectLabel.visible ).to.be.false;
			pv.setReadOnlyMode(true);
			expect( pv.magnify.visible ).to.be.true;
			expect( pv.camera.visible ).to.be.false;
			expect( pv.photoSelectOptionalLabel.visible ).to.be.false;
			expect( pv.photoSelectLabel.visible ).to.be.false;
			expect( pv.getThumbnailImageUrl() ).to.include("preview_thumbnail");
		}) );
		windowOpenTest( win );
	});

	it("should dynamically disable readonly mode", function( done ) { 
		makePhotoSelect( true, [
			'/spec/resources/simpleKey1/media/amphipoda_01.jpg',
			'/spec/resources/simpleKey1/media/amphipoda_02.jpg',
			'/spec/resources/simpleKey1/media/amphipoda_03.jpg'
		]);
		pv.on("loaded", () => checkTestResult( done, () => {
			expect( pv.magnify.visible ).to.be.true;
			expect( pv.camera.visible ).to.be.false;
			expect( pv.photoSelectOptionalLabel.visible ).to.be.false;
			expect( pv.photoSelectLabel.visible ).to.be.false;
			pv.setReadOnlyMode(false);
			expect( pv.magnify.visible ).to.be.true;
			expect( pv.camera.visible ).to.be.true;
			expect( pv.photoSelectOptionalLabel.visible ).to.be.false;
			expect( pv.photoSelectLabel.visible ).to.be.false;
			expect( pv.getThumbnailImageUrl() ).to.include("preview_thumbnail");
		}) );
		windowOpenTest( win );
	});

	it('should display a take photo view with please take photo message', function(done) {
		makePhotoSelect( false );
		windowOpenTest( win, () => checkTestResult( done, () => {
			expect( pv.magnify.visible, "magnify invisible" ).to.be.false;
			expect( pv.camera.visible, "camera visible"  ).to.be.true;
			expect( pv.photoSelectOptionalLabel.visible, "photoSelectOptionalLabel visible"  ).to.be.true;
			expect( pv.photoSelectLabel.visible, "photoSelectLabel invisible"  ).to.be.false;
		}) );
	});

	it('should display a take photo view with must take photo message on setError()', function(done) {
		makePhotoSelect( false, '/spec/resources/simpleKey1/media/speedbug/amphipoda_b.png' );
		pv.setError(); 
		pv.on("loaded", () => 
			checkTestResult( done, () => {
				expect( pv.magnify.visible ).to.be.false;
				expect( pv.camera.visible ).to.be.true;
				expect( pv.photoSelectOptionalLabel.visible ).to.be.false;
				expect( pv.photoSelectLabel.visible ).to.be.true;
				expect( pv.getThumbnailImageUrl() ).to.include("preview_thumbnail");
			}) 
		);
		windowOpenTest( win );
	});

	it('should clear must take photo message after clearError()', function(done) {
		makePhotoSelect( false, '/spec/resources/simpleKey1/media/speedbug/amphipoda_b.png' );
		pv.setError(); 
		pv.on("loaded", () => 
			checkTestResult( done, () => {
				pv.clearError(); 
				expect( pv.magnify.visible ).to.be.true;
				expect( pv.camera.visible ).to.be.true;
				expect( pv.photoSelectOptionalLabel.visible ).to.be.false;
				expect( pv.photoSelectLabel.visible ).to.be.false;
				expect( pv.getThumbnailImageUrl() ).to.include("preview_thumbnail");
			}) 
		);
		windowOpenTest( win );
	});

	it('should display a take photo view', function(done) {
		makePhotoSelect( false, '/spec/resources/simpleKey1/media/amphipoda_01.jpg' );
		pv.on("loaded", () => checkTestResult( done, () => {
			expect( pv.magnify.visible ).to.be.true;
			expect( pv.camera.visible ).to.be.true;
			expect( pv.getThumbnailImageUrl() ).to.include("preview_thumbnail");
			expect( pv.photoSelectOptionalLabel.visible ).to.be.false;
			expect( pv.photoSelectLabel.visible ).to.be.false;
		}) );
		windowOpenTest( win );
	});

	it('should remove take photo message after photo is taken', function(done) {
		this.timeout(10000);
		makePhotoSelect( false, '/spec/resources/simpleKey1/media/beetlelarvae.gif' );
		function testPhotoCapture() {
			pv.off("loaded", testPhotoCapture );
			pv.on("")
			pv.on("loaded", () => checkTestResult( done, () => {
					expect( pv.magnify.visible ).to.be.true;
					expect( pv.camera.visible ).to.be.true;
					expect( pv.getThumbnailImageUrl() ).to.include("preview_thumbnail");
					expect( pv.photoSelectLabel.visible ).to.be.false;
				} ) );
			setTimeout( () => simulatePhotoCapture( pv ), 500 );
		} 
		pv.on("loaded", testPhotoCapture);
		windowOpenTest( win );
	});
	// flakey test
	it.skip('should display loading indicator', async function() {
		makePhotoSelect( false, '/spec/resources/simpleKey1/media/beetlelarvae.gif' );

		let openWindow = new Promise( (resolve) => {
			pv.on("loaded", function e() { pv.off("loaded",e); resolve(); } );
			windowOpenTest( win );
		});

		await openWindow;

		let testLoadingPhoto = new Promise( (resolve) => {
			pv.on("loading", function e() { pv.off("loading",e); resolve(); } );
			simulatePhotoCapture( pv )
		});

		await testLoadingPhoto;

		await waitForTick(10)();

		expect( pv.activity.visible, "activity should be visible" ).to.be.true;
		expect( pv.photo.visible, "photo should not be visible" ).to.be.false;
			
		let testLoadedPhoto = new Promise( (resolve) => {
			pv.on("loaded", function e() { pv.off("loaded",e); resolve(); } );
		
		}); 

		await testLoadedPhoto;

		await waitForTick(10)();

		expect( pv.activity.visible, "activity should not be visible"  ).to.be.false;
		expect( pv.photo.visible, "photo should be visible" ).to.be.true;
	});

});

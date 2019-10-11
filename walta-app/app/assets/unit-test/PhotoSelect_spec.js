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
require("unit-test/lib/ti-mocha");
var { expect } = require('unit-test/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest, checkTestResult } = require('unit-test/util/TestUtils');
var { simulatePhotoCapture } = require("unit-test/mocks/MockCamera");

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

	it("should resize image", function(done) { 
		makePhotoSelect( true, '/unit-test/resources/site-mock.jpg' );
		pv.on("loaded", () => checkTestResult( done, () => {
			var photo = Ti.Filesystem.getFile(pv.photo.image).read();
			expect( photo.width ).to.be.at.most( 1600 );
            expect( photo.height ).to.be.at.most( 1200 );
		}) );
		windowOpenTest( win );
	});

	it("should display readonly view", function( done ) { 
		makePhotoSelect( true, [
			'/unit-test/resources/simpleKey1/media/amphipoda_01.jpg',
			'/unit-test/resources/simpleKey1/media/amphipoda_02.jpg',
			'/unit-test/resources/simpleKey1/media/amphipoda_03.jpg'
		]);
		pv.on("loaded", () => checkTestResult( done, () => {
			expect( pv.magnify.visible ).to.be.true;
			//expect( pv.camera.visible ).to.be.false;
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

	it('should display a take photo view with must take photo message', function(done) {
		makePhotoSelect( false, '/unit-test/resources/simpleKey1/media/amphipoda_01.jpg' );
		pv.setError();
		pv.on("loaded", () => checkTestResult( done, () => {
			expect( pv.magnify.visible ).to.be.true;
			expect( pv.camera.visible ).to.be.true;
			expect( pv.photoSelectOptionalLabel.visible ).to.be.false;
			expect( pv.photoSelectLabel.visible ).to.be.true;
			expect( pv.getThumbnailImageUrl() ).to.include("preview_thumbnail");
		}) );
		windowOpenTest( win );
	});

	it('should display a take photo view', function(done) {
		makePhotoSelect( false, '/unit-test/resources/simpleKey1/media/amphipoda_01.jpg' );
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
		makePhotoSelect( false, '/unit-test/resources/simpleKey1/media/beetlelarvae.gif' );
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

	it('should display loading indicator', function(done) {
		function doneOnError(e) {
			if ( e ) {
				done(e);
			}
		}
		makePhotoSelect( false, '/unit-test/resources/simpleKey1/media/beetlelarvae.gif' );
		function testPhotoCapture() {
			pv.off("loaded", testPhotoCapture );
			pv.on("loading", function handler() { 
				pv.off("loading", handler );
				checkTestResult( doneOnError, () => {
					expect( pv.activity.visible, "activity should be visible" ).to.be.true;
					expect( pv.photo.visible, "photo should not be visible" ).to.be.false;
					
				})
			});
			pv.on("loaded", function handler() {
				pv.off("loaded", handler );
				checkTestResult( done, () => {
					expect( pv.activity.visible, "activity should not be visible"  ).to.be.false;
					expect( pv.photo.visible, "photo should be visible" ).to.be.true;
				} ) 
			});
			setTimeout( () => simulatePhotoCapture( pv ), 500 );
		} 
		pv.on("loaded", testPhotoCapture);
		windowOpenTest( win );
	});

});

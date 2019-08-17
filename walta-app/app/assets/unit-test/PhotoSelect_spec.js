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

describe('PhotoSelect controller', function() {
	var win, vw, pv;

	function makePhotoSelect( readonly, images ) {
		pv = Alloy.createController("PhotoSelect", {readonly: readonly});
		pv.setImage(images);
		win = wrapViewInWindow(  _(pv.getView()).extend( { height: '100%', width: '100%' } ) );
	}

	before( function() {
		
	});

	after( function(done) {
		closeWindow( win, done );
	});

	it('should display readonly view', function( done ) { 
		makePhotoSelect( true, [
			'/unit-test/resources/simpleKey1/media/amphipoda_01.jpg',
			'/unit-test/resources/simpleKey1/media/amphipoda_02.jpg',
			'/unit-test/resources/simpleKey1/media/amphipoda_03.jpg'
		]);
		windowOpenTest( win, function() {
			checkTestResult( (e) => done(e), () => {
				expect( pv.iconHolder.children ).to.contain( pv.magnify );
				Ti.API.debug(`${JSON.stringify(pv.magnify.visible)}`);
				expect( pv.magnify.visible ).to.be.true;
				expect( pv.iconHolder.children ).to.not.contain( pv.camera );
				//expect( pv.photo.image ).to.equal("/unit-test/resources/simpleKey1/media/amphipoda_01.jpg");
				expect( pv.photoSelectLabel.visible ).to.be.false;
			}, 100);
		} );3
	});

	it('should display a take photo view with please take photo message', function(done) {
		makePhotoSelect( false );
		windowOpenTest( win, function() {
			checkTestResult( (e) => done(e), () => {
				expect( pv.iconHolder.children ).to.contain( pv.magnify );
				expect( pv.magnify.visible ).to.be.false;
				expect( pv.iconHolder.children ).to.contain( pv.camera );

				expect( pv.photoSelectOptionalLabel.visible ).to.be.true;
				expect( pv.photoSelectLabel.visible ).to.be.false;
				// TODO: automate the capture of a photo impossible from mocha ?!
			}, 100);
		} );
	});

	it('should display a take photo view with must take photo message', function(done) {
		makePhotoSelect( false, '/unit-test/resources/simpleKey1/media/amphipoda_01.jpg' );
		pv.setError();
		windowOpenTest( win, function() {
			checkTestResult( (e) => done(e), () => {
				expect( pv.iconHolder.children ).to.contain( pv.magnify );
				expect( pv.magnify.visible ).to.be.true;
				expect( pv.iconHolder.children ).to.contain( pv.camera );
				//expect( pv.photo.image ).to.equal("/unit-test/resources/simpleKey1/media/amphipoda_01.jpg");
				expect( pv.photoSelectOptionalLabel.visible ).to.be.false;
				expect( pv.photoSelectLabel.visible ).to.be.true;
			}, 100);
		} );
	});

	it('should display a take photo view', function(done) {
		makePhotoSelect( false, '/unit-test/resources/simpleKey1/media/amphipoda_01.jpg' );
		windowOpenTest( win, function() {
			checkTestResult( (e) => done(e), () => {
				expect( pv.iconHolder.children ).to.contain( pv.magnify );
				expect( pv.magnify.visible ).to.be.true;
				expect( pv.iconHolder.children ).to.contain( pv.camera );
				//expect( pv.photo.image ).to.equal("/unit-test/resources/simpleKey1/media/amphipoda_01.jpg");
				expect( pv.photoSelectLabel.visible ).to.be.false;
				// TODO: automate the capture of a photo impossible from mocha ?!
			}, 100 )
		});
	})

	
});

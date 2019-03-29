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
require("specs/lib/ti-mocha");
var { expect } = require('specs/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest } = require('specs/util/TestUtils');

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
			'/specs/resources/simpleKey1/media/amphipoda_01.jpg',
			'/specs/resources/simpleKey1/media/amphipoda_02.jpg',
			'/specs/resources/simpleKey1/media/amphipoda_03.jpg'
		]);
		windowOpenTest( win, function() {
			expect( pv.iconHolder.children ).to.contain( pv.magnify );
			expect( pv.iconHolder.children ).to.not.contain( pv.camera );
			expect( pv.photo.image ).to.equal("/specs/resources/simpleKey1/media/amphipoda_01.jpg");
			expect( pv.photoSelectLabel.visible ).to.be.false;
			// TODO: Test opening of photo gallery
			done();
		} );
	});

	it('should display a take photo view', function(done) {
		makePhotoSelect( false, '/specs/resources/simpleKey1/media/amphipoda_01.jpg' );
		windowOpenTest( win, function() {
			expect( pv.iconHolder.children ).to.contain( pv.magnify );
			expect( pv.iconHolder.children ).to.contain( pv.camera );
			expect( pv.photo.image ).to.equal("/specs/resources/simpleKey1/media/amphipoda_01.jpg");
			expect( pv.photoSelectLabel.visible ).to.be.false;
			// TODO: automate the capture of a photo impossible from mocha ?!
			done(); 
		} );
	})

	
});

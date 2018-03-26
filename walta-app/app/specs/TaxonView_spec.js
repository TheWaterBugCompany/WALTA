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
var TestUtils = require('specs/util/TestUtils');

if ( typeof(_) == "undefined") _ = require('underscore')._;
var meld = require('lib/meld');

var TaxonView = require('ui/TaxonView');
var Taxon = require('logic/Taxon');


describe.skip('TaxonView', function() {

	var tv, win;

	tv = TaxonView.createTaxonView(
			Taxon.createTaxon({
				id: "testTaxon",
				name: "Family Palaemonidae, Genus Macrobrachium",
				commonName: "Freshwater prawn",
				size: 300,
				habitat: "Crayfish in rivers (upper photo) yabbies in wetlands/pools (lower photo).",
				movement: "walking, with sudden flips when disturbed.",
				confusedWith: "Nothing, very distinctive, We have left crayfish and Yabbies grouped together because they mostly turn up as juveniles in samples and are difficult to spearate when young.",
				signalScore: 4,
				mediaUrls: [ "/specs/resources/simpleKey1/media/amphipoda_01.jpg", "/specs/resources/simpleKey1/media/amphipoda_02.jpg", "/specs/resources/simpleKey1/media/attack_caddis_01_x264.mp4" ]
			})
		);

	win = TestUtils.wrapViewInWindow( tv.view );


	it('should display the taxon view', function() {
		TestUtils.windowOpenTest( win );
	});

	it('the description text should be visible', function() {
		expect( tv._views.details.rect.height ).toBeGreaterThan( 0 );
	});

	it('the size of the text in the webview should be stable', function(done) {
		var oldHeight, flag, flag2;

		tv._views.details.addEventListener( 'postlayout', function() {
			expect( tv._views.details.evalJS("document.body.children[0].offsetHeight") ).toEqual( oldHeight );
			done();
		 } );

		oldHeight = tv._views.details.evalJS("document.body.children[0].offsetHeight");

		var photoView = tv._views.photoView;
		// Open and close the gallery to make resize bug occur
		var closeHandler = meld.before( photoView, 'onGalleryWinClosed', function( win ) {
			flag = true;
		});

		var openHandler = meld.before( photoView, 'onGalleryWinOpened', function( win ) {
				win._views.close.fireEvent('click');
			} );

		tv._views.photoView._views.zoomIcon.fireEvent('click');



	});

	TestUtils.closeWindow( win );

});

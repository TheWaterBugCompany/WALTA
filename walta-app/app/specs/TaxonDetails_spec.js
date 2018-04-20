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
var { wrapViewInWindow, setManualTests, closeWindow, windowOpenTest, actionFiresEventTest } = require('specs/util/TestUtils');

if ( typeof(_) == "undefined") _ = require('underscore')._;
var meld = require('lib/meld');

var Taxon = require('logic/Taxon');
describe('TaxonDetails', function() {
	var tv;
	this.timeout(10000);
	before( function(done) {
		tv = Alloy.createController( "TaxonDetails", {
					onOpen: function() {
						done()
					},
					taxon: Taxon.createTaxon({
						id: "testTaxon",
						name: "Family Palaemonidae, Genus Macrobrachium",
						commonName: "Freshwater prawn",
						size: 300,
						habitat: "Crayfish in rivers (upper photo) yabbies in wetlands/pools (lower photo).",
						movement: "walking, with sudden flips when disturbed.",
						confusedWith: "Nothing, very distinctive, We have left crayfish and Yabbies grouped together because they mostly turn up as juveniles in samples and are difficult to spearate when young.",
						signalScore: 4,
						mediaUrls: [
							"specs/resources/simpleKey1/media/amphipoda_01.jpg",
							"specs/resources/simpleKey1/media/amphipoda_02.jpg",
							"specs/resources/simpleKey1/media/attack_caddis_01_x264.mp4"
						]
					})
			});

	});

	after( function(done) {
		closeWindow( tv.getWindow(), done );
	});

	it('the description text should be visible', function() {
		expect( tv.details.rect.height ).to.be.above( 0 );
	});

	it.skip('the size of the text in the webview should be stable', function(done) {
		// Obsolete??
		var oldHeight = tv.details.evalJS("document.body.children[0].offsetHeight");
		var photoView = tv.photoView;
		var openHandler = meld.before( photoView, 'onGalleryWinOpened', function( win ) {
				tv.details.addEventListener( 'postlayout', function checkOffsetHeight() {
					expect( tv.details.evalJS("document.body.children[0].offsetHeight") ).to.equal( oldHeight );
					tv.details.removeEventListener('postlayout', checkOffsetHeight )
					done();
				} );
				win._views.close.fireEvent('click');
			} );

		tv.photoView._views.zoomIcon.fireEvent('click');
	});
});

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
var { checkTestResult, closeWindow, controllerOpenTest } = require('specs/util/TestUtils');

if ( typeof(_) == "undefined") _ = require('underscore')._;
var meld = require('lib/meld');

var Taxon = require('logic/Taxon');
describe('TaxonDetails controller', function() {
	var tv;
	beforeEach( function() {
		tv = Alloy.createController( "TaxonDetails", {
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
							"/specs/resources/simpleKey1/media/amphipoda_01.jpg",
							"/specs/resources/simpleKey1/media/amphipoda_02.jpg",
							"/specs/resources/simpleKey1/media/attack_caddis_01_x264.mp4"
						]
					})
			});
	});

	afterEach( function(done) {
		closeWindow( tv.getView(), done );
	});

	/* Yuck couldn't figure out a way to do this without setTimeout() hopefuly 1s is enough */
	it.only('the description text should be visible', function(done) {
		this.timeout(2000);
		controllerOpenTest( tv );
		setTimeout(function() {
			checkTestResult( done, function() {
				expect( tv.details.size.height ).to.be.above( 0 );
			}); 
		}, 1000 );
	});

	it('the size of the text in the webview should be stable', function(done) {
		this.timeout(10000);
		controllerOpenTest( tv, function(){
			setTimeout( function() {
				var oldHeight = tv.details.evalJS("document.body.children[0].offsetHeight");
				var photoView = tv.photoView;
				meld.before( photoView, 'onGalleryWinOpened', function( win ) {
					setTimeout( function() {
						win.addEventListener( 'close', function checkOffsetHeight() {
							win.removeEventListener('close', checkOffsetHeight );
							setTimeout( function() {
								checkTestResult( done, function() {
									expect( tv.details.evalJS("document.body.children[0].offsetHeight") ).to.equal( oldHeight );
								});
							}, 1000 );
						} );
						win.closeButton.fireEvent('click');
					}, 1000);
				} );
				photoView.zoomIcon.fireEvent('click');
			}, 1000 );
		});
	});
});

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
						scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"class","name":"Decapoda"},{"taxonomicLevel":"family","name":"Palaemonidae"},{"taxonomicLevel":"genus","name":"Macrobrachium"}],
						size: 300,
						habitat: "Crayfish in rivers (upper photo) yabbies in wetlands/pools (lower photo).",
						movement: "walking, with sudden flips when disturbed.",
						confusedWith: "Nothing, very distinctive, We have left crayfish and Yabbies grouped together because they mostly turn up as juveniles in samples and are difficult to spearate when young.",
						signalScore: 4,
						description: "Random text to to at the end. Lorem ipsum etc. Lorem ipsum etc. Lorem ipsum etc. Lorem ipsum etc. Lorem ipsum etc.",
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

	it.only('the description text should be visible', function(done) {
		controllerOpenTest( tv, done );
	});
});
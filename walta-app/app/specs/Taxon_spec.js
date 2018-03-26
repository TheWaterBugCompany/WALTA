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
var Taxon = require('logic/Taxon');
describe.skip('Taxon tests', function() {
	var txn = Taxon.createTaxon({
		id: "testTaxon",
		name: "Family Palaemonidae, Genus Macrobrachium",
		commonName: "Freshwater prawn",
		size: 300,
		habitat: "Crayfish in rivers (upper photo) yabbies in wetlands/pools (lower photo).",
		movement: "walking, with sudden flips when disturbed.",
		confusedWith: "Nothing, very distinctive, We have left crayfish and Yabbies grouped together because they mostly turn up as juveniles in samples and are difficult to spearate when young.",
		signalScore: 4,
		mediaUrls: [ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg", "resources/simpleKey1/media/attack_caddis_01_x264.mp4" ],
		parentLink: {
				id: "textTaxon2",
				name: "parent name",
				commonName: "Test critter",
				parentLink: {
					id: "testTexon3",
					name: "parent parent name",
					commonName: "Test critter 3"
				}
			}
		}
	);
	it('should store taxon properties', function(){
		expect(txn.id).toEqual("testTaxon");
		expect(txn.name).toEqual("Family Palaemonidae, Genus Macrobrachium");
		expect(txn.commonName).toEqual("Freshwater prawn");
		expect(txn.size).toEqual(300);
		expect(txn.habitat).toEqual("Crayfish in rivers (upper photo) yabbies in wetlands/pools (lower photo).");
		expect(txn.movement).toEqual("walking, with sudden flips when disturbed.");
		expect(txn.confusedWith).toEqual("Nothing, very distinctive, We have left crayfish and Yabbies grouped together because they mostly turn up as juveniles in samples and are difficult to spearate when young.");
		expect(txn.signalScore).toEqual(4);
		expect(txn.mediaUrls).toEqual([ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg", "resources/simpleKey1/media/attack_caddis_01_x264.mp4" ]);
	});
	it('should determine the media type from the extension names', function(){
		expect(txn.photoUrls).toEqual([ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg" ] );
		expect(txn.videoUrl).toEqual( "resources/simpleKey1/media/attack_caddis_01_x264.mp4" );
	});
	it('should return the detail as HTML properly', function(){
		expect(txn.asDetailHtml()).toEqual("<b>Family Palaemonidae, Genus Macrobrachium</b><p><b>Size:</b> Up to 300mm</p>"
			+   "<p><b>Habitat:</b> Crayfish in rivers (upper photo) yabbies in wetlands/pools (lower photo).</p>"
			+   "<p><b>Movement:</b> walking, with sudden flips when disturbed.</p>"
			+	"<p><b>Confused with:</b> Nothing, very distinctive, We have left crayfish and Yabbies grouped together because they mostly turn up as juveniles in samples and are difficult to spearate when young.</p>"
			+	"<p><b>SIGNAL score: 4</b></p>"
			+   "<p>parent name<br>parent parent name</p>"
			+   "<p></p>");
	});

});

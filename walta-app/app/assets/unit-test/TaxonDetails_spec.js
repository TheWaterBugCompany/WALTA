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
var { checkTestResult, closeWindow, controllerOpenTest, setManualTests, actionFiresTopicTest } = require('unit-test/util/TestUtils');
var Topics = require('ui/Topics');
var Taxon = require('logic/Taxon');
describe('TaxonDetails controller', function() {
	context("descriptive text ", function() { 
		var tv;
		before( function(done) {
			tv = Alloy.createController( "TaxonDetails", {
						node: Taxon.createTaxon({
							id: "testTaxon",
							name: "Family Palaemonidae, Genus Macrobrachium",
							commonName: "Freshwater prawn",
							scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"class","name":"Decapoda"},{"taxonomicLevel":"family","name":"Palaemonidae"},{"taxonomicLevel":"genus","name":"Macrobrachium"}],
							size: 300,
							habitat: "Crayfish in rivers (upper photo) yabbies in wetlands/pools (lower photo).",
							movement: "walking, with sudden flips when disturbed.",
							confusedWith: "Nothing, very distinctive, We have left crayfish and Yabbies grouped together because they mostly turn up as juveniles in samples and are difficult to spearate when young.",
							signalScore: 4,
							description: "Random text at the end. Lorem ipsum etc. Lorem ipsum etc. Lorem ipsum etc. Lorem ipsum etc. Lorem ipsum etc.",
							mediaUrls: [
								"/unit-test/resources/simpleKey1/media/amphipoda_01.jpg",
								"/unit-test/resources/simpleKey1/media/amphipoda_02.jpg",
								"/unit-test/resources/simpleKey1/media/attack_caddis_01_x264.mp4"
							]
						})
				});
			controllerOpenTest( tv, done );
		});
	
		after( function(done) {
			closeWindow( tv.getView(), done );
		});

		it.only('the description text should be visible', function() {
			expect(tv.description.text).to.contain("Random text at the end");
		});

		it('the common name should be visible', function() {
			expect(tv.title.text).to.equal("Freshwater prawn");
		});

		it('the size field should be correct', function() {
			expect(tv.size.text).to.equal("300 mm");
		});

		it('the habitat field should be correct', function() {
			expect(tv.habitat.text).to.contain("yabbies in wetlands/pools");
		});

		it('the movement field should be correct', function() {
			expect(tv.movement.text).to.equal("walking, with sudden flips when disturbed.");
		});

		it('the confused with field should be correct', function() {
			expect(tv.confusedWith.text).to.contain("Nothing, very distinctive");
		});
		
		it('the signal score field should be correct', function() {
			expect(tv.signalScore.text).to.equal(4);
		});

		it('the scientific name field should be correct', function() {
			const labels = tv.scientificClassification.children;
			expect(labels[0].text).to.equal("phylum: Arthropoda");
			expect(labels[1].text).to.equal("subphylum: Crustacea");
			expect(labels[2].text).to.equal("class: Decapoda");
			expect(labels[3].text).to.equal("family: Palaemonidae");
			expect(labels[4].text).to.equal("genus: Macrobrachium");
		});

		it('should fire the UP topic', function(done) {
			actionFiresTopicTest( tv.header, 'click', Topics.UP, () => done() );
		});
	});
	it('should display only the relevant media icons');
	it('should only display the add sample button during a survey');
	it('should correctly pass the media to the gallery widget');
});
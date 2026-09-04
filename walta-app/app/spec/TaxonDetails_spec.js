require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { checkTestResult, closeWindow, controllerOpenTest, setManualTests, actionFiresTopicTest } = require('spec/util/TestUtils');
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
								"/spec/resources/simpleKey1/media/amphipoda_01.jpg",
								"/spec/resources/simpleKey1/media/amphipoda_02.jpg",
								"/spec/resources/simpleKey1/media/attack_caddis_01_x264.mp4"
							]
						})
				});
			controllerOpenTest( tv, done );
		});
	
		after( function(done) {
			closeWindow( tv.getView(), done );
		});

		it('the description text should be visible', function() {
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
	// The key is the only allowed path during a training assessment, so the taxon
	// end screen must not offer the speedbug/browse anchor shortcuts in training —
	// otherwise they slip past the greyed MethodSelect and cheat the exercise.
	context('training gating', function() {
		function anchorImages(ctl) {
			return ctl.getAnchorBar().leftTools.children.map(function(c) { return c.image; });
		}
		function makeTaxon() {
			return Taxon.createTaxon({
				id: "t1", name: "Test", commonName: "Test bug", scientificName: [],
				size: 1, habitat: "", movement: "", confusedWith: "", signalScore: 1,
				description: "", mediaUrls: []
			});
		}

		context('in a survey', function() {
			var tv;
			before( function(done) {
				tv = Alloy.createController( "TaxonDetails", { node: makeTaxon() } );
				controllerOpenTest( tv, done );
			});
			after( function(done) { closeWindow( tv.getView(), done ); });

			it('offers the speedbug and browse shortcuts', function() {
				var imgs = anchorImages( tv );
				expect( imgs ).to.include( '/images/icon-speedbug-white.png' );
				expect( imgs ).to.include( '/images/icon-browse-white.png' );
			});
		});

		context('in training mode', function() {
			var tv;
			before( function(done) {
				tv = Alloy.createController( "TaxonDetails", { node: makeTaxon(), training: true } );
				controllerOpenTest( tv, done );
			});
			after( function(done) { closeWindow( tv.getView(), done ); });

			it('hides the speedbug and browse shortcuts so the key is the only path', function() {
				var imgs = anchorImages( tv );
				expect( imgs ).to.not.include( '/images/icon-speedbug-white.png' );
				expect( imgs ).to.not.include( '/images/icon-browse-white.png' );
			});
		});
	});

	// The end of the key is the furthest point from the tray, so the taxon screen
	// offers a way back to the one the identification started from.
	context('tray button', function() {
		function trayButton(ctl) {
			return ctl.getAnchorBar().leftTools.children.find( function(c) {
				return c.image === '/images/icon-icecube-white.png';
			});
		}
		function makeTaxon() {
			return Taxon.createTaxon({
				id: "t1", name: "Test", commonName: "Test bug", scientificName: [],
				size: 1, habitat: "", movement: "", confusedWith: "", signalScore: 1,
				description: "", mediaUrls: []
			});
		}
		var tv;
		afterEach( function(done) { closeWindow( tv.getView(), done ); });

		function open(args) {
			return new Promise( function(resolve) {
				tv = Alloy.createController( "TaxonDetails", _({ node: makeTaxon() }).extend(args) );
				controllerOpenTest( tv, resolve );
			});
		}

		it('offers a way back to the tray the identification started from', async function() {
			await open({ allowAddToSample: true });
			expect( trayButton( tv ).visible ).to.equal( true );
		});

		it('offers none when the taxon was not reached from a tray', async function() {
			await open({ allowAddToSample: false });
			expect( trayButton( tv ).visible ).to.equal( false );
		});
	});

	it('should display only the relevant media icons');
	it('should only display the add sample button during a survey');
	it('should correctly pass the media to the gallery widget');
});
require("spec/lib/tijasmine").infect(this);
var Taxon = require('logic/Taxon');
describe('Taxon tests', function() {
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

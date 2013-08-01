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
		mediaUrls: [ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg", "resources/simpleKey1/media/attack_caddis_01_x264.mp4" ] 
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
	})
});

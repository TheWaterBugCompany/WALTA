var Question = require('logic/Question');

describe('Question tests', function() {
	var qn = Question.createQuestion({
		text: "Family Palaemonidae, Genus Macrobrachium",
		outcome: null,
		mediaUrls: [ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg", "resources/simpleKey1/media/attack_caddis_01_x264.mp4" ] 
		}
	);
	it('should store Question properties', function(){
		expect(qn.text).toEqual("Family Palaemonidae, Genus Macrobrachium");
		expect(qn.mediaUrls).toEqual([ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg", "resources/simpleKey1/media/attack_caddis_01_x264.mp4" ]);
	});
	it('should determine the media type from the extension names', function(){
		expect(qn.photoUrls).toEqual([ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg" ] );
		expect(qn.videoUrl).toEqual( "resources/simpleKey1/media/attack_caddis_01_x264.mp4" );
	});
});

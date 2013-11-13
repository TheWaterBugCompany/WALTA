require("spec/lib/tijasmine").infect(this);
var MediaUtil = require('logic/MediaUtil');
describe('MediaUtil tests', function() {
	mediaUrls = [ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg", "resources/simpleKey1/media/attack_caddis_01_x264.mp4" ]; 
	it('should determine the media type from the extension names', function(){
		var res = MediaUtil.resolveMediaUrls( mediaUrls );
		expect(res.photoUrls).toEqual([ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg" ] );
		expect(res.videoUrl).toEqual( "resources/simpleKey1/media/attack_caddis_01_x264.mp4" );
	});
});

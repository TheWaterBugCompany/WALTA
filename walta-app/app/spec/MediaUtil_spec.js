require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var MediaUtil = require('logic/MediaUtil');
describe('MediaUtil tests', function() {
	var mediaUrls = [ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg", "resources/simpleKey1/media/attack_caddis_01_x264.mp4" ];
	it('should determine the media type from the extension names', function(){
		var res = MediaUtil.resolveMediaUrls( mediaUrls );
		expect(res.photoUrls).to.deep.equal([ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg" ] );
		expect(res.videoUrl).to.equal( "resources/simpleKey1/media/attack_caddis_01_x264.mp4" );
	});
});

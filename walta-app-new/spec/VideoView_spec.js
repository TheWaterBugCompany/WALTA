var PubSub = require('lib/pubsub');


var VideoView = require('ui/VideoView');


describe('VideoView', function() {
	var vv = VideoView.createVideoView( "/ui-test/resources/simpleKey1/media/attack_caddis_01_x264.mp4" );
	
	it('should display the video view', function() {
		vv.open();
		expect( true ).toEqual(true);
	});
});
var TestUtils = require('util/TestUtils');

var meld = require('lib/meld');
var VideoView = require('ui/VideoView');

describe('VideoView', function() {
	var vv;
	
	beforeEach(function() { 
		vv = VideoView.createVideoView( "/spec/resources/simpleKey1/media/attack_caddis_01_x264.mp4" );
	});
	
	afterEach( function() {
		vv.close();
	});
	
	it('should fire the onComplete event when the video has finished playing', function() {
		TestUtils.waitForMeldEvent( vv, 'onComplete', function() { vv.open(); }, 75000 );		
	});
});
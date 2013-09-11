var PubSub = require('lib/pubsub');


var VideoView = require('ui/VideoView');
var vv = VideoView.createVideoView( "/ui-test/resources/simpleKey1/media/attack_caddis_01_x264.mp4" );

function run() {
	vv.open();
}

exports.run = run;

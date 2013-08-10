/*
 * Module: ViewView
 * 
 * Plays a video full screen with simple controls
 * 
 */

var _ = require('lib/underscore')._;
var Layout = require('ui/Layout');

function createVideoView( url ) {
	var playButton = Ti.UI.createButton({
		width: Layout.VIDEO_OVERLAY_BUTTON_SIZE,
		height: Layout.VIDEO_OVERLAY_BUTTON_SIZE, 
		backgroundImage: '/images/play.png'
	});
	var closeButton = Ti.UI.createButton({
		width: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE,
		height: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE, 
		backgroundImage: '/images/close.png',
		top: Layout.WHITESPACE_GAP,
		right: Layout.WHITESPACE_GAP
	});
	var vv = {
		open: function() {
			var vp = Ti.Media.createVideoPlayer({
				url: url,
				autoplay: true,
				backgroundColor: 'black',
				fullscreen: true,
				mediaControlStyle: Ti.Media.VIDEO_CONTROL_NONE,
				scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FIT
			});
			
			closeButton.addEventListener( 'click', function(e){ 
				vp.hide();
			});
			
			vp.add( closeButton );
			
			playButton.addEventListener( 'click', function(e){
				vp.play();
				vp.remove( playButton );
				e.cancelBubble = true;
			});
			
			vp.addEventListener( 'complete', function(e) {
				vp.add( playButton );
			});
			
			vp.addEventListener( 'click', function(e) {
				vp.pause();
				vp.add( playButton );
				e.cancelBubble = true;
			});
		}
	}
	return vv;
}

exports.createVideoView = createVideoView;
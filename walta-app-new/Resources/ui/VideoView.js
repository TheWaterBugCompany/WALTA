/*
 * Module: VideoView
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
			var win = Ti.UI.createWindow( { 
					backgroundColor: 'black', 
					orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] 
				} );
			var vp = Ti.Media.createVideoPlayer({
				width: Ti.UI.FILL,
				height: Ti.UI.FILL,
				url: url,
				autoplay: true,
				backgroundColor: 'black',
				fullscreen: true,
				mediaControlStyle: Ti.Media.VIDEO_CONTROL_NONE,
				scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FIT
			});
			win.add( vp );
			vp.add( closeButton );

			playButton.addEventListener( 'click', function(e){
				vp.play();
				vp.remove( playButton );
				e.cancelBubble = true;
			});
			
			vp.addEventListener( 'complete', function(e) {
				vp.setCurrentPlaybackTime( 0 );
				vp.add( playButton );
			});
			
			vp.addEventListener( 'click', function(e) {
				vp.pause();
				vp.add( playButton );
				e.cancelBubble = true;
			});
			// On android this opens fullscreen automatically
			// but on iOS it doesn't. Why is this API is so different??
			if ( Ti.Platform.osname === 'android') {
				closeButton.addEventListener( 'click', function(e){ 
					vp.hide();
				});
			} else {
				closeButton.addEventListener( 'click', function(e){ 
					win.close();
				});
				vp.setFullscreen( false );
				win.open();
			}
			
		}
	};
	return vv;
}

exports.createVideoView = createVideoView;
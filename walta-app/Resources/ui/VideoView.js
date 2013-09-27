/*
 * Module: VideoView
 * 
 * Plays a video full screen with simple controls
 * 
 */

var _ = require('lib/underscore')._;
var Layout = require('ui/Layout');

function createVideoView( url ) {
	
	var vv = { _views: {}, win: null, vp: null };
	
	vv._views.playButton = Ti.UI.createButton({
		width: Layout.VIDEO_OVERLAY_BUTTON_SIZE,
		height: Layout.VIDEO_OVERLAY_BUTTON_SIZE, 
		backgroundImage: '/images/play.png'
	});
	vv._views.closeButton = Ti.UI.createButton({
		width: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE,
		height: Layout.FULLSCREEN_CLOSE_BUTTON_SIZE, 
		backgroundImage: '/images/close.png',
		top: Layout.WHITESPACE_GAP,
		right: Layout.WHITESPACE_GAP
	});
	vv.onComplete = function() {}; // Callback so the callers knows when the video is finished playing
	vv.close = function() {
		if ( Ti.Platform.osname === 'android') {
			vv.vp.hide();
		} else {
			vv.win.close();
		}
	};
	vv.open = function() {
			vv.win = Ti.UI.createWindow( { 
					backgroundColor: 'black', 
					orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] 
				} );
			vv.vp = Ti.Media.createVideoPlayer({
				width: Ti.UI.FILL,
				height: Ti.UI.FILL,
				url: url,
				autoplay: true,
				backgroundColor: 'black',
				fullscreen: true,
				mediaControlStyle: Ti.Media.VIDEO_CONTROL_NONE,
				scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FIT
			});
			vv.win.add( vv.vp );
			vv.vp.add( vv._views.closeButton );

			vv._views.playButton.addEventListener( 'click', function(e){
				vp.play();
				vp.remove( playButton );
				e.cancelBubble = true;
			});
			
			vv.vp.addEventListener( 'complete', function(e) {
				vv.vp.setCurrentPlaybackTime( 0 );
				vv.vp.add( vv._views.playButton );
				vv.onComplete();
			});
			
			vv.vp.addEventListener( 'click', function(e) {
				vv.vp.pause();
				vv.vp.add( vv._views.playButton );
				e.cancelBubble = true;
			});
			// On android this opens fullscreen automatically
			// but on iOS it doesn't. Why is this API is so different??
			if ( Ti.Platform.osname === 'android') {
				vv._views.closeButton.addEventListener( 'click', function(e){ 
					vv.vp.hide();
				});
			} else {
				vv._views.closeButton.addEventListener( 'click', function(e){ 
					vv.win.close();
				});
				vv.vp.setFullscreen( false );
				vv.win.open();
			}
		};
	return vv;
}

exports.createVideoView = createVideoView;
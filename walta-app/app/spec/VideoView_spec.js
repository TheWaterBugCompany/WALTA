require("spec/lib/ti-mocha");
var Topics = require('ui/Topics');
var { expect } = require("spec/lib/chai");
var { checkTestResult, closeWindow, controllerOpenTest } = require("spec/util/TestUtils");

describe('VideoView', function() {
	var ctl;
    this.timeout(6000);
	beforeEach(function() {
        ctl = Alloy.createController("VideoPlayer", { 
                url: '/spec/resources/simpleKey1/media/test_clip.mp4' 
            });
	});

	afterEach( function(done) {
	    closeWindow( ctl.getView(), done );
	});

	it('should fire the complete event when the video has finished playing', function(done) {
        function success() {
            ctl.videoPlayer.removeEventListener("complete", success);
            done();
        } 
        ctl.videoPlayer.addEventListener("complete", success );
		controllerOpenTest( ctl, function() {} );
    });

    it('should fire the BACK topic when the close button is pressed',function(done){
        function success() {
            Topics.unsubscribe(Topics.BACK, success);
            done();
        }
        Topics.subscribe(Topics.BACK, success);
        controllerOpenTest( ctl, function() {
            ctl.closeButton.closeButton.fireEvent("click");
        } );
    });

    it('should play the movie again if the play button is pressed',function(done){
        this.timeout(6000);
        function first() {
            ctl.videoPlayer.removeEventListener("complete", first);
            ctl.videoPlayer.addEventListener("complete", second);
            setTimeout( () => ctl.playButton.fireEvent("click"), 100 );
        } 
        function second() {
            ctl.videoPlayer.removeEventListener("complete", second);
            done();
        } 
        ctl.videoPlayer.addEventListener("complete", first );
        controllerOpenTest( ctl, function() {} );
    });

    it('should pause the video if the screen is clicked',function(done){
        function onState(e) {
            if ( e.playbackState !== Ti.Media.VIDEO_PLAYBACK_STATE_PLAYING ) return;
            ctl.videoPlayer.removeEventListener("playbackstate", onState);
            // Pausing at the play transition stops the player (state 0) on iOS — let
            // playback establish first, then click while it's genuinely playing.
            setTimeout( function() {
                ctl.videoPlayer.fireEvent("click");
                setTimeout( ()=> checkTestResult( done,
                    function() {
                        expect( ctl.videoPlayer.playbackState).to.equal(Ti.Media.VIDEO_PLAYBACK_STATE_PAUSED);
                    }), 200 );
            }, 200 );
        }
        ctl.videoPlayer.addEventListener("playbackstate", onState);
        controllerOpenTest( ctl, function() {} );
    });
});

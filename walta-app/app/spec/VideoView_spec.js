require("spec/lib/ti-mocha");
var Topics = require('ui/Topics');
var { expect } = require("spec/lib/chai");
var { checkTestResult, closeWindow, controllerOpenTest, waitFor } = require("spec/util/TestUtils");

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

    // The stylesheet asked for a constant the SDK does not define, so scalingMode
    // was set to undefined and the player fell back to fitting the video inside
    // the view — the letterbox bars above and below it on every device. A name
    // that does not resolve fails silently, so the test is that the player ends
    // up with a scaling mode at all, and that it is the one that fills.
    it('fills the screen with the video rather than letterboxing it', function(done) {
        controllerOpenTest( ctl, function() {
            checkTestResult( done, function() {
                expect( Ti.Media.VIDEO_SCALING_RESIZE_ASPECT_FILL,
                    'the SDK no longer defines the scaling constant this asserts on' ).to.not.be.undefined;
                expect( ctl.videoPlayer.scalingMode,
                    'scalingMode is unset, so the video is fitted inside the view' ).to.not.be.undefined;
                expect( ctl.videoPlayer.scalingMode ).to.equal( Ti.Media.VIDEO_SCALING_RESIZE_ASPECT_FILL );
            });
        });
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

    it('should fill the window it was given, under the home indicator', async function() {
        await controllerOpenTest( ctl );
        await waitFor( () => ctl.isSafeAreaApplied() );
        expect( ctl.content.rect.height ).to.equal( ctl.TopLevelWindow.rect.height );
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

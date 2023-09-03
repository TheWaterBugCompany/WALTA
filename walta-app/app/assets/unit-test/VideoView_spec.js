/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require("unit-test/lib/ti-mocha");
var Topics = require('ui/Topics');
var { expect } = require("unit-test/lib/chai");
var { checkTestResult, closeWindow, controllerOpenTest } = require("unit-test/util/TestUtils");

describe('VideoView', function() {
	var ctl;
    this.timeout(6000);
	beforeEach(function() {
        ctl = Alloy.createController("VideoPlayer", { 
                url: '/unit-test/resources/simpleKey1/media/test_clip.mp4' 
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
        controllerOpenTest( ctl, function() {
            setTimeout( function() {
                ctl.videoPlayer.fireEvent("click");
                setTimeout( ()=> checkTestResult( done,
                    function() {
                        expect( ctl.videoPlayer.playbackState).to.equal(Ti.Media.VIDEO_PLAYBACK_STATE_PAUSED);
                    }), 1000 );
                },1200);
            });
    });
});

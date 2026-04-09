
/*
 * Conttoller: VideoPlayer
 * 
 * Opens video player
 *
 */
var Topics = require('ui/Topics');

exports.baseController  = "TopLevelWindow";
$.name = "video-player";
$.videoPlayer.url = $.args.url;

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.TopLevelWindow.removeEventListener('close', cleanUp );
    $.videoPlayer.release();
});

$.TopLevelWindow.addEventListener('open', function open() {
    $.TopLevelWindow.removeEventListener('open', open );
    playVideo();
});

$.closeButton.on("close", () => Topics.fireTopicEvent( Topics.BACK ) );

function playVideo() {
    $.videoPlayer.currentPlaybackTIme = 0;
    $.content.remove( $.playButton );
    $.videoPlayer.play();
}

function pauseVideo() {
    $.videoPlayer.pause();
    $.content.add( $.playButton );
}

function completeVideo() {
    $.content.add( $.playButton );
}


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


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
require("spec/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');

var meld = require('lib/meld');
var VideoView = require('ui/VideoView');

describe('VideoView', function() {
	var vv;

	beforeEach(function() {
		vv = VideoView.createVideoView( Ti.Filesystem.resourcesDirectory + 'specs/resources/simpleKey1/media/attack_caddis_01_x264.mp4' );
	});

	afterEach( function() {
		vv.close();
	});

	it('should fire the onComplete event when the video has finished playing', function() {
		TestUtils.waitForMeldEvent( vv, 'onComplete', function() { vv.open(); }, 75000 );
	});
});

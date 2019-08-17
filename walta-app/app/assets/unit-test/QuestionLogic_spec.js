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
require("unit-test/lib/mocha");
var { expect } = require('unit-test/lib/chai');
var Question = require('logic/Question');

describe('Question tests', function() {
	var qn = Question.createQuestion({
		text: "Family Palaemonidae, Genus Macrobrachium",
		outcome: null,
		mediaUrls: [ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg", "resources/simpleKey1/media/attack_caddis_01_x264.mp4" ]
		}
	);
	it('should store Question properties', function(){
		expect(qn.text).to.equal("Family Palaemonidae, Genus Macrobrachium");
		expect(qn.mediaUrls).to.have.members([ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg", "resources/simpleKey1/media/attack_caddis_01_x264.mp4" ]);
	});
	it('should determine the media type from the extension names', function(){
		expect(qn.photoUrls).to.have.members([ "resources/simpleKey1/media/amphipoda_01.jpg", "resources/simpleKey1/media/amphipoda_02.jpg" ] );
		expect(qn.videoUrl).to.equal( "resources/simpleKey1/media/attack_caddis_01_x264.mp4" );
	});
});

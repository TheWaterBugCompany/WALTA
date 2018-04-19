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
var KeyNode = require('logic/Key');
var Question = require('logic/Question');

describe('KeyNode tests', function() {
	var kn = KeyNode.createKeyNode( {
		questions: [
			Question.createQuestion({
				text: "Question 1",
				outcome: null,
				mediaUrls: [ "spec/resources/simpleKey1/media/amphipoda_01.jpg" ] 
			}),
			Question.createQuestion({
				text: "Question 2",
				outcome: null,
				mediaUrls: [ "spec/resources/simpleKey1/media/amphipoda_02.jpg", "spec/resources/simpleKey1/media/attack_caddis_01_x264.mp4" ] 
			})
		],
		parentLink: null
	});
	
	it('should store both questions', function(){
		expect( kn.questions.length).toEqual(2);
		
		expect(kn.questions[0].text).toEqual("Question 1");
		expect(kn.questions[0].mediaUrls).toEqual([ "spec/resources/simpleKey1/media/amphipoda_01.jpg" ]);
		
		expect(kn.questions[1].text).toEqual("Question 2");
		expect(kn.questions[1].mediaUrls).toEqual([ "spec/resources/simpleKey1/media/amphipoda_02.jpg", "spec/resources/simpleKey1/media/attack_caddis_01_x264.mp4" ]);
	});
});
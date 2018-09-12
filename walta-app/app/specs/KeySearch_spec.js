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
require("specs/lib/ti-mocha");
var { expect } = require('specs/lib/chai');
var { closeWindow, controllerOpenTest, actionFiresTopicTest } = require('specs/util/TestUtils');

var Question = require('logic/Question');
var Key = require('logic/Key');
var Topics = require('ui/Topics');

describe('KeySearch controller', function() {
	var knv;
	before( function(done) {
		// Create a test key to display
	 var key = Key.createKey( {
					url: 'https://example.com/',
					name: 'TestTaxonomy',
					root: Key.createKeyNode({
						questions: [
							Question.createQuestion( {
								text: "This is a test question text! With an longer question text that needs to wrap plus a couple of media images",
								mediaUrls: [
									'/specs/resources/simpleKey1/media/amphipoda_01.jpg'
									]
								}),
								Question.createQuestion( {
								text: "This is the a second test question",
								mediaUrls: [
									"/specs/resources/simpleKey1/media/amphipoda_02.jpg",
									"/specs/resources/simpleKey1/media/attack_caddis_01_x264.mp4"
									]
								})
							]
					})
				});
			knv = Alloy.createController("KeySearch", { keyNode: key.getCurrentNode() });
			controllerOpenTest( knv, done );
	});
	after( function(done) {
			closeWindow( knv.getView(), done );
	})

	it('should fire the FORWARD topic', function(done) {
		actionFiresTopicTest( knv.getQuestions()[1].view, 'click', Topics.FORWARD, done );
	});

});

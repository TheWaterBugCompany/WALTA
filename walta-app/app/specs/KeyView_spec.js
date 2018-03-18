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
require("specs/lib/ti-mocha").infect(this);
var TestUtils = require('util/TestUtils');

var Question = require('logic/Question');
var Key = require('logic/Key');
var KeyView = require('ui/KeyView');
var TopLevelWindow = require('ui/TopLevelWindow');

var Topics = require('ui/Topics');

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

describe('KeyView', function() {
	var knv = KeyView.createKeyView( key.getCurrentNode() );
	var win;

	it('should display the key view', function() {

		win = TopLevelWindow.makeTopLevelWindow({
				title: 'ALT Key',
				uiObj: knv
			});
	});

	it('should fire the FORWARD topic', function() {
		var result = TestUtils.actionFiresTopicTest( knv._views.questions[1].view, 'click', Topics.FORWARD );
		runs( function() {
			expect( result.data ).toEqual( 1 );
		});
	});

	TestUtils.closeWindow( win );
});

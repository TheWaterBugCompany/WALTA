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
require("specs/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');

var _ = require('lib/underscore')._;
var meld = require('lib/meld');

var QuestionView = require('ui/QuestionView');
var Question = require('logic/Question');

describe('QuestionView', function() {
	var qv, win;

	qv = QuestionView.createQuestionView(
	Question.createQuestion( {
			text: "This is a test question text! With an longer question text that needs to wrap plus a couple of media images",
			mediaUrls: [
				'/specs/resources/simpleKey1/media/amphipoda_01.jpg',
				'/specs/resources/simpleKey1/media/amphipoda_02.jpg',
				'/specs/resources/simpleKey1/media/amphipoda_03.jpg'
				]
			})
	);
	win = Ti.UI.createWindow( {
		backgroundColor: 'white',
		orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] }
	);
	win.add( _(qv.view).extend( { height: '45%', width: '98%' } ) );

	it('should display the question view', function() {
		TestUtils.windowOpenTest( win );
	});

	it('should fire the onSelect event when a question is clicked', function() {
		TestUtils.actionFiresEventTest( qv.view, 'click', qv, 'onSelect' );
	});

	TestUtils.closeWindow( win );

});

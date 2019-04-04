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
var { wrapViewInWindow, closeWindow, windowOpenTest, actionFiresEventTest } = require('specs/util/TestUtils');
var Question = require('logic/Question');

describe.only('Question controller', function() { 
	var win, qv;

	function makeQuestionWindow(question) {
		qv = Alloy.createController("Question", { question: question });
		return wrapViewInWindow(  _(qv.getView()).extend( { height: '45%', width: '98%' } ) );
	}

	after( function(done) {
		closeWindow( win, done );
	});

	it('should display the question view with a photo', function(done) {
		win = makeQuestionWindow(Question.createQuestion( {
			text: "This is a test question text! With a longer question text that needs to wrap plus a couple of media images",
			mediaUrls: [
				'/specs/resources/simpleKey1/media/amphipoda_01.jpg',
				'/specs/resources/simpleKey1/media/amphipoda_02.jpg',
				'/specs/resources/simpleKey1/media/amphipoda_03.jpg'
				]
			}));
		windowOpenTest( win, done );
	});

	it.only('should display the question view without a photo', function(done) {
		win = makeQuestionWindow(Question.createQuestion( {
			text: "This is a test question text! With a longer question text that needs to wrap without media images.",
			mediaUrls: []
			}));
		windowOpenTest( win, done );
	});

	it('should fire the onSelect event when a question is clicked', function(done) {
		win = makeQuestionWindow(Question.createQuestion( {
			text: "This is a test question text! With a longer question text that needs to wrap plus a couple of media images",
			mediaUrls: [
				'/specs/resources/simpleKey1/media/amphipoda_01.jpg',
				'/specs/resources/simpleKey1/media/amphipoda_02.jpg',
				'/specs/resources/simpleKey1/media/amphipoda_03.jpg'
				]
			}));
		windowOpenTest( win, function() {
			actionFiresEventTest( qv.getView(), 'click', qv, 'select', done );
		} );
		
	});
});

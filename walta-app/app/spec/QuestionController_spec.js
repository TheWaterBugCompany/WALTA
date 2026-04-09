require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest, actionFiresEventTest } = require('spec/util/TestUtils');
var Question = require('logic/Question');

describe('Question controller', function() { 
	var win, qv;

	function makeQuestionWindow(question) {
		qv = Alloy.createController("Question", { question: question });
		win = wrapViewInWindow(  _(qv.getView()).extend( { height: '45%', width: '98%' } ) );
		win.addEventListener("close", function cleanUp() {
			win.removeEventListener("close", cleanUp);
			qv.cleanUp();
		});
		return win;
	}

	afterEach( function(done) {
		closeWindow( win, done );
	});

	it('should display the question view with a photo', function(done) {
		win = makeQuestionWindow(Question.createQuestion( {
			text: "This is a test question text! With a longer question text that needs to wrap plus a couple of media images",
			mediaUrls: [
				'/spec/resources/simpleKey1/media/amphipoda_01.jpg',
				'/spec/resources/simpleKey1/media/amphipoda_02.jpg',
				'/spec/resources/simpleKey1/media/amphipoda_03.jpg'
				]
			}));
		windowOpenTest( win, done );
	});

	it('should display the question view without a photo', function(done) {
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
				'/spec/resources/simpleKey1/media/amphipoda_01.jpg',
				'/spec/resources/simpleKey1/media/amphipoda_02.jpg',
				'/spec/resources/simpleKey1/media/amphipoda_03.jpg'
				]
			}));
		windowOpenTest( win, function() {
			actionFiresEventTest( qv.getView(), 'click', qv, 'select', done );
		} );
		
	});
});

require("spec/lib/tijasmine").infect(this);
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
				'/spec/resources/simpleKey1/media/amphipoda_01.jpg',
				'/spec/resources/simpleKey1/media/amphipoda_02.jpg',
				'/spec/resources/simpleKey1/media/amphipoda_03.jpg'
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

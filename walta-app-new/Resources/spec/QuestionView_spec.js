var _ = require('lib/underscore')._;
var meld = require('lib/meld');

var QuestionView = require('ui/QuestionView');
var Question = require('logic/Question');
var TestUtils = require('util/TestUtils');

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
		var openCalled = false;		
		runs(function() {		
			win.addEventListener( 'open', function(e) { openCalled = true; } );
			win.open();
		});
		
		waitsFor(function() {
			return openCalled;
		}, "Window to open", 750 );
		
		runs(function() {
			expect( openCalled, true );
		});
	});
	
	it('should fire the onSelect event when a question is clicked', function() {
		var evtFires = false;	
		var evt = null;
		runs(function() {	
			meld.on( qv, "onSelect", function(e) { evt = this; evtFires = true; } );
			win.open();
			qv.view.fireEvent('click');
		});
		
		waitsFor(function() {
			return evtFires;
		}, "onSelect to be called", 750 );
		
		runs(function() {
			expect( evtFires, true );
			expect( evt.question.text).toEqual("This is a test question text! With an longer question text that needs to wrap plus a couple of media images" );
		});
		
	});
	
	runs(function() {
		if ( ! TestUtils.isManualTests() ) {
			win.close();
		}
	});
	
});

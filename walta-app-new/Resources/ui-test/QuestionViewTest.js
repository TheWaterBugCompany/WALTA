var _ = require('lib/underscore')._;
var meld = require('lib/meld');

var QuestionView = require('ui/QuestionView');
var Question = require('logic/Question');

var qv = QuestionView.createQuestionView( 
	Question.createQuestion( { 
			text: "This is a test question text! With an longer question text that needs to wrap plus a couple of media images", 
			mediaUrls: [ 
				'/ui-test/resources/simpleKey1/media/amphipoda_01.jpg',
				'/ui-test/resources/simpleKey1/media/amphipoda_02.jpg',
				'/ui-test/resources/simpleKey1/media/amphipoda_03.jpg'
				] 
			})
);
var win = Ti.UI.createWindow( { 
	backgroundColor: 'white', 
	orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] } 
);
win.add( _(qv.view).extend( { height: '45%', width: '90%' } ) );
win.addEventListener( 'click',  function(e) { win.close();  e.cancelBubble = true; } );
meld.on( qv, "onSelect", function(e) {
	alert( "Question selected: test = '" + this.question.text + "'" );
} );

function run() {
	win.open();
}

exports.run = run;

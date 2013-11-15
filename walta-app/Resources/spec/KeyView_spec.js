require("spec/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');

var Question = require('logic/Question');
var Key = require('logic/Key');
var KeyView = require('ui/KeyView');

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
							'/spec/resources/simpleKey1/media/amphipoda_01.jpg'
							] 
						}),
						Question.createQuestion( { 
						text: "This is the a second test question", 
						mediaUrls: [ 
							"/spec/resources/simpleKey1/media/amphipoda_02.jpg", 
							"/spec/resources/simpleKey1/media/attack_caddis_01_x264.mp4"
							] 
						})
					]
			})
		});

describe('KeyView', function() {
	var  win,knv;
	knv = KeyView.createKeyView( key.getCurrentNode() );
	win = TestUtils.wrapViewInWindow( knv.view );

	it('should display the key view', function() {
		TestUtils.windowOpenTest( win ); 
	});
	
	it('should fire the FORWARD topic', function() { 
		var result = TestUtils.actionFiresTopicTest( knv._views.questions[1].view, 'click', Topics.FORWARD );
		runs( function() {
			expect( result.data ).toEqual( 1 );	
		});
	});
	
	TestUtils.closeWindow( win );
});
var Question = require('logic/Question');
var Key = require('logic/Key');
var KeyView = require('ui/KeyView');

// Create a test key to display

var key = Key.createKey( {
			url: 'https://example.com/',
			name: 'TestTaxonomy',
			root: Key.createKeyNode({
				questions: [
					Question.createQuestion( { 
						text: "This is a test question text! With an longer question text that needs to wrap plus a couple of media images", 
						mediaUrls: [ 
							'/ui-test/resources/simpleKey1/media/amphipoda_01.jpg'
							] 
						}),
						Question.createQuestion( { 
						text: "This is the a second test question", 
						mediaUrls: [ 
							"/ui-test/resources/simpleKey1/media/amphipoda_02.jpg", 
							"/ui-test/resources/simpleKey1/media/attack_caddis_01_x264.mp4"
							] 
						})
					]
			})
		});

describe('KeyView', function() {
	var  win,knv;
	beforeEach(function(){
		win = Ti.UI.createWindow( { 
			backgroundColor: 'white', 
			orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] } 
		);
		
		knv = KeyView.createKeyView( key );
		win.add( _(knv.view).extend( { height: '100%', width: '100%' } ) );
	});
	
	afterEach(function() {
		win.close();
	});
	
	it('should display the key view', function() {
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
			// can we check things like actual height and width here??
		});
	});
});
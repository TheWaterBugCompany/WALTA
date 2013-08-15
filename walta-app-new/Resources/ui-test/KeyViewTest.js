var _ = require('lib/underscore')._;
var meld = require('lib/meld');
var PubSub = require('lib/pubsub');

var KeyView = require('ui/KeyView');
var Question = require('logic/Question');
var Key = require('logic/Key');

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

var win = Ti.UI.createWindow( { 
	backgroundColor: 'white', 
	orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] } 
);

var knv = KeyView.createKeyView( key );

win.add( _(knv.view).extend( { height: '100%', width: '100%' } ) );
win.addEventListener( 'click',  function(e) { win.close();  e.cancelBubble = true; } );

PubSub.subscribe( KeyView.topics.BACK, function() { alert("Back pressed" ); } );

function run() {
	win.open();
}

exports.run = run;

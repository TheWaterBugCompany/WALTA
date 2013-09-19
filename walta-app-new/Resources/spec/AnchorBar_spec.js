var TestUtils = require('util/TestUtils');

var PubSub = require('lib/pubsub');
var AnchorBar = require('ui/AnchorBar');
var Topics = require('Topics');

describe('AnchorBar', function() {
	var acb, win;
	
	
	acb = AnchorBar.createAnchorBar();
	win = TestUtils.wrapViewInWindow( acb.view );

	it('should display an anchor bar at the top of the screen', function() {
		TestUtils.windowOpenTest( win ); 
	});
	
	it('should fire the HOME event when the home button is clicked', function() {
		TestUtils.actionFiresTopicTest( acb._views.home, 'click', Topics.HOME );
	});
	
	it('should fire the SETTINGS event when the settings button is clicked', function() {
		TestUtils.actionFiresTopicTest( acb._views.settings, 'click', Topics.SETTINGS );
	});
	
	it('should fire the INFO event when the settings button is clicked', function() {
		TestUtils.actionFiresTopicTest( acb._views.info, 'click', Topics.INFO );
	});

	TestUtils.closeWindow( win );
});
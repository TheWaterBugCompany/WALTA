var TestUtils = require('util/TestUtils');
var MenuView = require('ui/MenuView');
var Topics = require('Topics');

describe('MenuView', function() {
	var mnu, win;

	mnu = MenuView.createMenuView();
	win = TestUtils.wrapViewInWindow( mnu.view );
	
	it('should display the menu view', function() { 
		TestUtils.windowOpenTest( win ); 
	});
	
	it('should fire the KEYSEARCH topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.keysearch, 'click', Topics.KEYSEARCH );
	});
	
	it('should fire the SPEEDBUG topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.speedbug, 'click', Topics.SPEEDBUG );
	});
	
	it('should fire the BROWSE topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.browse, 'click', Topics.BROWSE );
	});
	
	it('should fire the HELP topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.help, 'click', Topics.HELP );
	});
	
	it('should fire the GALLERY topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.gallery, 'click', Topics.GALLERY );
	});
	
	it('should fire the ABOUT topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.about, 'click', Topics.ABOUT );
	});
	
	TestUtils.closeWindow( win );
	
});

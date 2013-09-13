Ti.include('util/TestUtils.js');
var MenuView = require('ui/MenuView');

describe('MenuView', function() {
	var mnu, win;

	mnu = MenuView.createMenuView();
	win = TestUtils.wrapViewInWindow( mnu.view );
	
	it('should display the menu view', function() { 
		TestUtils.windowOpenTest( win ); 
	});
	
	it('should fire the KEYSEARCH topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.keysearch, 'click', MenuView.topics.KEYSEARCH );
	});
	
	it('should fire the SPEEDBUG topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.speedbug, 'click', MenuView.topics.SPEEDBUG );
	});
	
	it('should fire the BROWSE topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.browse, 'click', MenuView.topics.BROWSE );
	});
	
	it('should fire the HELP topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.help, 'click', MenuView.topics.HELP );
	});
	
	it('should fire the GALLERY topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.gallery, 'click', MenuView.topics.GALLERY );
	});
	
	it('should fire the ABOUT topic', function() { 
		TestUtils.actionFiresTopicTest( mnu._views.about, 'click', MenuView.topics.ABOUT );
	});
	
	TestUtils.closeWindow( win );
	
});

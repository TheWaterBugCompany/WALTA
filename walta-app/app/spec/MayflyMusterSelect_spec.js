require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, setManualTests, closeWindow, windowOpenTest, waitForEvent } = require('spec/util/TestUtils');
var Topics = require('ui/Topics');

describe('MayflyMusterSelect', function() { 
	var mnu, win;
	before( function() {
		mnu = Alloy.createController("MayflyMusterSelect");
		win = wrapViewInWindow( mnu.getView() );
		win.addEventListener("close", function cleanUp() {
            win.removeEventListener("close", cleanUp );
            mnu.cleanUp();
        })
	});

	after( function(done) { 
		closeWindow( win, done );
	});

	it('should open menu', function(done) { 
		windowOpenTest( win, done );
	});

});

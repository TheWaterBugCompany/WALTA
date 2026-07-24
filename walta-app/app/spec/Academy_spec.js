require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, windowOpenTest, closeWindow } = require('spec/util/TestUtils');

describe('Academy modal', function() {
	var ctl, win;
	this.timeout(5000);

	beforeEach( function(done) {
		ctl = Alloy.createController("Academy");
		win = wrapViewInWindow( ctl.getView() );
		windowOpenTest( win, done );
	});

	afterEach( function(done) {
		closeWindow( win, done );
	});

	it('renders the modal with the code boxes and buttons', function() {
		expect( ctl.digit1 ).to.exist;
		expect( ctl.digit2 ).to.exist;
		expect( ctl.digit3 ).to.exist;
		expect( ctl.startButton ).to.exist;
		expect( ctl.cancelButton ).to.exist;
	});
});

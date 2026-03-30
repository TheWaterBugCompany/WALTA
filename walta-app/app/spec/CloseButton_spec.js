require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, wrapViewInWindow, windowOpenTest, actionFiresEventTest } = require("spec/util/TestUtils");
describe("CloseButton controller", function() {
	var ctl,win;
	beforeEach( async () => {
        ctl = Alloy.createController("CloseButton");
		win = wrapViewInWindow( ctl.getView() );
        await windowOpenTest( win );
	});
	afterEach( async () => await closeWindow( win ) );
	it('should fire the close event when the close button is clicked',  
        async () => actionFiresEventTest( ctl.closeButton, 'click', ctl, 'close' )
    );
});
require("unit-test/lib/ti-mocha");
var { expect } = require("unit-test/lib/chai");
var { closeWindow, wrapViewInWindow, windowOpenTest, actionFiresEventTest } = require("unit-test/util/TestUtils");
describe("CloseButton controller", function() {
	var ctl,win;
	beforeEach( async () => {
        ctl = Alloy.createController("CloseButton");
		win = wrapViewInWindow( ctl.getView() );
        await windowOpenTest( win );
	});
	afterEach( async () => await closeWindow( ctl.getView() ) );
	/*it('should fire the close event when the close button is clicked',  
        // FiXME: Why does this test always passed ??
        async () => actionFiresEventTest( ctl.closeButton, 'click', ctl, 'close' )
    );*/
});
require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, windowOpenTest, wrapViewInWindow } = require("spec/util/TestUtils");
describe("LeafletMap controller", function() {
	var ctl,win;
	before( function() {
    ctl = Alloy.createController("LeafletMap");
    win = wrapViewInWindow( ctl.getView() );
	});
	after( function(done) {
		closeWindow( win, done );
	});
	it('should display the LeafletMap view', function(done) {
		windowOpenTest( win, done );
    });
});
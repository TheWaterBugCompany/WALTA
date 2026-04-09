require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, controllerOpenTest } = require("spec/util/TestUtils");
describe.only("<Controller> controller", function() {
	var ctl;
	beforeEach( async () => {
		ctl = Alloy.createController("<Controller>");
    await controllerOpenTest( ctl );
	});
	afterEach( async () => await closeWindow( ctl.getView() ) );
	it('should display the <Controller> view',() => {});
});
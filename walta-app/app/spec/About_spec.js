require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, controllerOpenTest } = require("spec/util/TestUtils");
describe("About controller", function() {
	var ctl;
	beforeEach( async () => {
		ctl = Alloy.createController("About", { keyUrl: Ti.Filesystem.resourcesDirectory + "taxonomy/walta/" });
    await controllerOpenTest( ctl );
  });
  afterEach( async () => await closeWindow( ctl.getView() ) );
	it('should display the About view', () => {});
});
require("spec/lib/ti-mocha");
var Topics = require("ui/Topics");
var { closeWindow, controllerOpenTest, actionFiresTopicTest } = require("spec/util/TestUtils");
describe("Help controller", function() {
	var ctl;
	beforeEach( async () => {
		ctl = Alloy.createController("Help", { keyUrl: Ti.Filesystem.resourcesDirectory + "taxonomy/walta/" });
    await controllerOpenTest( ctl );
  });
	afterEach( async () => await closeWindow( ctl.getView() ) );
	it('should display the Help view', () => {});
  it('should fire the BACK event when the close button is clicked',  
    async () => actionFiresTopicTest( ctl.closeButton.closeButton, 'click', Topics.BACK )
  );
});
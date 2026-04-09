require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var Topics = require("ui/Topics");
var { closeWindow, controllerOpenTest, actionFiresTopicTest } = require("spec/util/TestUtils");
var { keyMock } = require('spec/mocks/MockKey');
var mediaResource = "spec/resources/simpleKey1/media/";
describe("Gallery controller", function() {
	var ctl;
	before( function() {
		ctl = Alloy.createController("Gallery", { photos: [mediaResource + 'amphipoda_01.jpg',mediaResource + 'amphipoda_02.jpg',mediaResource + 'amphipoda_03.jpg'] });
	});
	after( function(done) {
		closeWindow( ctl.getView(), done );
	});
	it('should display the Gallery view', function(done) {
		controllerOpenTest( ctl, done );
    });
  it('should fire the BACK event when the close button is clicked',  
    async () => actionFiresTopicTest( ctl.closeButton.closeButton, 'click', Topics.BACK )
  );
});
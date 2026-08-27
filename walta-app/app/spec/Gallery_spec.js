require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var Topics = require("ui/Topics");
var { closeWindow, controllerOpenTest, actionFiresTopicTest } = require("spec/util/TestUtils");
var { keyMock } = require('spec/mocks/MockKey');
var mediaResource = "spec/resources/simpleKey1/media/";

function findLabel( view ) {
	if ( view.apiName === "Ti.UI.Label" ) return view;
	return ( view.children || [] ).reduce( ( found, child ) => found || findLabel( child ), null );
}

describe("Gallery controller", function() {
	var ctl;
	var taxonPhoto = { url: mediaResource + 'amphipoda_01.jpg', taxon: { id: "amphipoda", taxonId: "amphipoda", name: "Amphipoda" } };
	before( function() {
		ctl = Alloy.createController("Gallery", { photos: [mediaResource + 'amphipoda_01.jpg',mediaResource + 'amphipoda_02.jpg',mediaResource + 'amphipoda_03.jpg', taxonPhoto] });
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
  it('should browse the taxon without offering to add it to a sample', async function() {
    var data = await actionFiresTopicTest( findLabel( ctl.scrollView.views[3] ), 'click', Topics.JUMPTO );
    expect( data.allowAddToSample ).to.equal(false);
  });
});

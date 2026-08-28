require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var Topics = require("ui/Topics");
var { closeWindow, controllerOpenTest, actionFiresTopicTest } = require("spec/util/TestUtils");
var Key = require("logic/Key");
var Taxon = require("logic/Taxon");
var mediaResource = "/spec/resources/simpleKey1/media/";

function findLabel( view ) {
	if ( view.apiName === "Ti.UI.Label" ) return view;
	return ( view.children || [] ).reduce( ( found, child ) => found || findLabel( child ), null );
}

// A key whose taxa carry photos, since findAllMedia is the only thing this screen
// asks a key for.
function galleryKey() {
	var key = Key.createKey({ url: "https://example.com", name: "WALTA" });
	[
		Taxon.createTaxon({ id: "amphipoda", taxonId: "2", name: "Amphipoda", mediaUrls: [ mediaResource + "amphipoda_01.jpg", mediaResource + "amphipoda_02.jpg" ] }),
		Taxon.createTaxon({ id: "anisops", taxonId: "3", name: "Anisops", mediaUrls: [ mediaResource + "amphipoda_03.jpg" ] }),
	].forEach( function(t) { key.attachTaxon(t); } );
	return key;
}

// Browsing the key. Every photo it shows belongs to a taxon, so every page names
// one and leads into the key — photos the reader took are the PhotoViewer's, and
// this screen has no way to be handed them.
describe("Gallery controller", function() {
	var ctl;
	before( function() {
		ctl = Alloy.createController("Gallery", { key: galleryKey() });
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
		var data = await actionFiresTopicTest( findLabel( ctl.scrollView.views[0] ), 'click', Topics.JUMPTO );
		expect( data.allowAddToSample ).to.equal(false);
	});
	// Three photos across two taxa; the screen opens on a shuffled handful of them.
	it('should name a taxon on every page', function() {
		ctl.scrollView.views.forEach( function( page, i ) {
			expect( findLabel( page ), `page ${i} names its taxon` ).to.not.be.null;
		});
	});
});

require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, actionFiresTopicTest, clickButton } = require("spec/util/TestUtils");
var Topics = require("ui/Topics");
var { View } = require("logic/View");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var CerdiApi = require("spec/mocks/MockCerdiApi");
Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
describe('Menu controller', function() {
	var view, mnu;
	// Open through View so the Titanium-free lib/mvvm/controllers/Menu screen
	// controller wires the view-model.
	beforeEach( async function() {
		view = new View( makeTestServices() );
		await view.openView("Menu", {unknown_bug:true});
		mnu = view.getCurrentController();
	});
	afterEach( async function() {
		await closeWindow( mnu.getView() );
	});

	it('should fire the DETAILED topic', function(done) {
		actionFiresTopicTest( mnu.detailed, 'click', Topics.DETAILED, () => done() );
	});

	it('should fire the GALLERY topic', function(done) {
		actionFiresTopicTest( mnu.gallery, 'click', Topics.GALLERY, () => done() );
	});

	it('should fire the ABOUT topic', function(done) {
		actionFiresTopicTest( mnu.about, 'click', Topics.ABOUT, () => done() );
	});

	// Acceptance tests locate the login label by accessibility id, so it has to
	// survive the open — iOS drops accessibilityLabel writes made before then.
	it('should expose the login state as an accessibility label once open', function() {
		expect( mnu.logInLabel.accessibilityLabel ).to.equal( mnu.logInLabel.text );
	});

	it('should offer Academy immediately before About', function() {
		var buttons = mnu.smallOptions.children;
		expect( mnu.academyLabel.text ).to.equal("Academy");
		expect( buttons.indexOf( mnu.academy ) ).to.equal( buttons.indexOf( mnu.about ) - 1 );
	});

	// Identify opens the MethodSelect chooser via the SELECT_METHOD topic; the
	// selection -> topic routing lives in the MethodSelect modal (see
	// test/controllers/MethodSelect_spec.js).
	it('should open the identification-method chooser', function(done) {
		Topics.subscribe(Topics.SELECT_METHOD, (data) => {
			expect( data.allowAddToSample ).to.equal(false);
			done();
		});
		clickButton( mnu.identify );
	});

});

require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, actionFiresTopicTest, clickButton } = require("spec/util/TestUtils");
var Topics = require("ui/Topics");
var { View } = require("logic/View");
var CerdiApi = require("spec/mocks/MockCerdiApi");
Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
describe('Menu controller', function() {
	var view, mnu;
	// Open through View so the Titanium-free lib/mvvm/controllers/Menu screen
	// controller wires the view-model (bindView + identify/logout routing).
	beforeEach( async function() {
		view = new View({
			cerdiApi: Alloy.Globals.CerdiApi,
			topics: Topics,
			environment: Alloy.CFG.environment,
			version: Ti.App.version
		});
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

	it('should fire the KEYSEARCH topic', function(done) {
		clickButton( mnu.identify );
		Topics.subscribe(Topics.KEYSEARCH, () => done() );
		mnu.selectMethod.trigger("keysearch");
	});

	it('should fire the SPEEDBUG topic', function(done) {
		clickButton( mnu.identify );
		Topics.subscribe(Topics.SPEEDBUG, () => done() );
		mnu.selectMethod.trigger("speedbug");
	});

	it('should fire the BROWSE topic', function(done) {
		clickButton( mnu.identify );
		Topics.subscribe(Topics.BROWSE, () => done()  );
		mnu.selectMethod.trigger("browselist");
	});

});

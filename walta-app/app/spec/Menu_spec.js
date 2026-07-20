require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, controllerOpenTest, actionFiresTopicTest, clickButton } = require("spec/util/TestUtils");
var Topics = require("ui/Topics");
var CerdiApi = require("spec/mocks/MockCerdiApi");
Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
describe('Menu controller', function() {
	var mnu;
	beforeEach( function( done ) {
		mnu = Alloy.createController("Menu", {unknown_bug:true});
		controllerOpenTest( mnu, done );
	});
	afterEach( function(done) {
		closeWindow( mnu.getView(), done );
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

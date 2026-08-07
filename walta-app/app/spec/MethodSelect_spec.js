require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest } = require('spec/util/TestUtils');
var { View } = require("logic/View");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var { makeBinder } = require("util/bindView");
var createMethodSelect = require("mvvm/controllers/MethodSelect");
var Topics = require("ui/Topics");

// Drives the real modal — the Alloy presenter, the screen controller, and the
// entry collection binding that builds real MenuButton components through the
// View seam — so the on-device rendering and greying are exercised. Entry
// routing and greying logic are covered in Node (test/controllers, test/viewmodels).
describe('MethodSelect', function() {
	var mod, win, ctl, host;

	function open(args) {
		return new Promise(function(resolve) {
			host = new View(makeTestServices());
			mod = Alloy.createController("MethodSelect", args);
			win = wrapViewInWindow( mod.getView() );
			ctl = createMethodSelect({
				view: mod,
				close: function() {},
				services: { topics: Topics },
				bindView: makeBinder(function(name, a) { return host.createComponent(name, a); }, Alloy.CFG.colors),
				args: args
			});
			windowOpenTest( win, resolve );
		});
	}

	afterEach( async function() {
		await closeWindow( win );
		if ( ctl ) ctl.dispose();   // disposes the entry components via the collection binder
		mod.destroy();
	});

	context("training mode", function() {
		beforeEach(function() { return open({ training: true, unknownBug: true }); });

		it('renders a card for every method', function() {
			expect( mod.content.children.length ).to.equal(4);
		});
	});

	context("normal mode", function() {
		beforeEach(function() { return open({ unknownBug: false }); });

		it('renders the key, speedbug and browse cards', function() {
			expect( mod.content.children.length ).to.equal(3);
		});
	});
});

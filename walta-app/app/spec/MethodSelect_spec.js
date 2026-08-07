require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest } = require('spec/util/TestUtils');
var createMethodSelect = require("mvvm/controllers/MethodSelect");
var { makeBinder } = require("util/bindView");
var Topics = require("ui/Topics");

// Drives the real modal — the Alloy presenter plus the Titanium-free screen
// controller wired through bindView — so the on-device greying of the real
// MenuButtons is exercised. Selection→topic routing is covered in Node
// (test/controllers/MethodSelect_spec.js).
describe('MethodSelect', function() {
	var mnu, win, ctl;

	function open(args) {
		return new Promise(function(resolve) {
			mnu = Alloy.createController("MethodSelect", { unknownBug: args.unknownBug });
			win = wrapViewInWindow( mnu.getView() );
			ctl = createMethodSelect({
				view: mnu,
				close: function() {},
				services: { topics: Topics },
				bindView: makeBinder(),
				args: args
			});
			windowOpenTest( win, resolve );
		});
	}

	afterEach( async function() {
		await closeWindow( win );
		if ( ctl ) ctl.dispose();
		mnu.cleanUp();
	});

	context("training mode", function() {
		beforeEach(function() { return open({ training: true, unknownBug: true }); });

		it('greys every option except the key', function() {
			expect( mnu.keysearch.disabled ).to.equal(false);
			expect( mnu.speedbug.disabled ).to.equal(true);
			expect( mnu.browselist.disabled ).to.equal(true);
			expect( mnu.unknownbug.disabled ).to.equal(true);
		});

		it('dims the greyed options on screen', function() {
			expect( mnu.speedbug.button.opacity ).to.equal(0.5);
			expect( mnu.browselist.button.opacity ).to.equal(0.5);
			expect( mnu.unknownbug.button.opacity ).to.equal(0.5);
		});
	});

	context("normal mode", function() {
		beforeEach(function() { return open({ unknownBug: true }); });

		it('leaves every option enabled', function() {
			expect( mnu.keysearch.disabled ).to.equal(false);
			expect( mnu.speedbug.disabled ).to.equal(false);
			expect( mnu.browselist.disabled ).to.equal(false);
			expect( mnu.unknownbug.disabled ).to.equal(false);
		});
	});

	context("without the unknown bug", function() {
		beforeEach(function() { return open({}); });

		it('omits the unknown-bug option', function() {
			expect( mnu.unknownbug ).to.be.undefined;
		});
	});
});

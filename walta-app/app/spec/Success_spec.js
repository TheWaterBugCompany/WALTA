require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest } = require('spec/util/TestUtils');
var createSuccess = require("mvvm/controllers/Success");
var { makeBinder } = require("util/bindView");
var Topics = require("ui/Topics");

// Drives the real Success modal — the Alloy presenter plus the Titanium-free
// screen controller through bindView — so the message and confetti render
// on-device. Finish/close routing is covered in Node (test/controllers/Success_spec.js).
describe('Success modal', function() {
	var mod, win, ctl;

	function open(args) {
		return new Promise(function(resolve) {
			mod = Alloy.createController("Success");
			win = wrapViewInWindow( mod.getView() );
			ctl = createSuccess({
				view: mod,
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
		mod.destroy();
	});

	beforeEach(function() { return open({ correctCount: 6 }); });

	it('renders the congratulation message with the correct count', function() {
		expect( mod.successMessage.text ).to.equal("Well done! You've identified the 6 correct creatures!");
	});

	it('shows the confetti graphic and the Finish button', function() {
		expect( mod.successGraphic ).to.exist;
		expect( mod.finishButton.title ).to.equal("Finish");
	});
});

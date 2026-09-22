require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest } = require('spec/util/TestUtils');
var { View } = require("logic/View");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var createTrainingSuccess = require("mvvm/controllers/TrainingSuccess");
var { makeBinder } = require("util/bindView");
var Topics = require("ui/Topics");

// Drives the real TrainingSuccess modal — the Alloy presenter plus the Titanium-free
// screen controller through bindView — so the message and confetti render
// on-device. Finish/close routing is covered in Node (test/controllers/TrainingSuccess_spec.js).
describe('TrainingSuccess modal', function() {
	var host, mod, win, ctl;

	function open(args, belt) {
		return new Promise(function(resolve) {
			host = new View(makeTestServices());
			mod = Alloy.createController("TrainingSuccess");
			win = wrapViewInWindow( mod.getView() );
			ctl = createTrainingSuccess({
				view: mod,
				close: function() {},
				services: { topics: Topics, belts: { currentBelt: function () { return belt || null; } } },
				bindView: makeBinder(function(name, a) { return host.createComponent(name, a); }, Alloy.CFG.colors),
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

	it('keeps the belt off the screen when the session earned none', function() {
		expect( mod.beltMessage.visible ).to.equal( false );
		expect( mod.beltHolder.visible ).to.equal( false );
	});

	it('renders the congratulation message with the correct count', function() {
		expect( mod.successMessage.text ).to.equal("Well done! You've identified the 6 correct creatures!");
	});

	it('shows the confetti graphic and the Finish button', function() {
		expect( mod.successGraphic ).to.exist;
		expect( mod.finishButton.title ).to.equal("Finish");
	});
});

// Named distinctly from 'TrainingSuccess modal' so --grep can open just this state.
describe('TrainingSuccess belt', function() {
	var host, mod, win, ctl;

	afterEach( async function() {
		await closeWindow( win );
		if ( ctl ) ctl.dispose();
		mod.destroy();
	});

	function openWearing(belt) {
		return new Promise(function(resolve) {
			host = new View(makeTestServices());
			mod = Alloy.createController("TrainingSuccess");
			win = wrapViewInWindow( mod.getView() );
			ctl = createTrainingSuccess({
				view: mod,
				close: function() {},
				services: { topics: Topics, belts: { currentBelt: function () { return belt; } } },
				bindView: makeBinder(function(name, a) { return host.createComponent(name, a); }, Alloy.CFG.colors),
				args: { correctCount: 6 }
			});
			windowOpenTest( win, resolve );
		});
	}

	it('names the belt just earned and draws it', async function() {
		await openWearing({ color: "#FFFFFF", tipColor: "#FEFF46" });
		expect( mod.beltMessage.text ).to.equal("You've earned your white with yellow tip belt:");
		expect( mod.beltMessage.visible ).to.equal( true );
		expect( mod.beltHolder.visible ).to.equal( true );
		expect( mod.beltHolder.children.length ).to.equal( 1 );
	});
});

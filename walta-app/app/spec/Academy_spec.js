require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, windowOpenTest, closeWindow, waitFor } = require('spec/util/TestUtils');

describe('Academy modal', function() {
	var ctl, win;

	beforeEach( function(done) {
		ctl = Alloy.createController("Academy");
		win = wrapViewInWindow( ctl.getView() );
		windowOpenTest( win, done );
	});

	afterEach( function(done) {
		closeWindow( win, done );
	});

	it('renders the modal with the code boxes and buttons', function() {
		expect( ctl.digit1 ).to.exist;
		expect( ctl.digit2 ).to.exist;
		expect( ctl.digit3 ).to.exist;
		expect( ctl.startButton ).to.exist;
		expect( ctl.cancelButton ).to.exist;
	});

});

// Drives the real ViewModel + bindView onto the Alloy widgets the way
// View.openModal does, so the Start button's rendered enabled/colour reflects
// the entered code — the shell-only describe above can't exercise that.
describe('Academy start button state', function() {
	var makeBinder = require('util/bindView').makeBinder;
	var createAcademy = require('mvvm/controllers/Academy');
	var createTraining = require('logic/Training');
	var createTrainingExercises = require('logic/TrainingExercises');

	var ctl, win, lib;

	beforeEach( function(done) {
		ctl = Alloy.createController("Academy");
		win = wrapViewInWindow( ctl.getView() );
		windowOpenTest( win, function() {
			var exercises = createTrainingExercises({ "101": [90,198,176,131], "999": [181,179] });
			var topics = { fireTopicEvent: function(){}, TRAINING_STARTED: "t", TRAININGTRAY: "s" };
			var repo = { startSession: function(){ return { length: 0, taxa: function(){ return []; } }; } };
			var services = { Training: createTraining({ topics: topics, repo: repo, exercises: exercises }), topics: topics };
			lib = createAcademy({ view: ctl, close: function(){}, services: services, bindView: makeBinder(function(){}, Alloy.CFG.colors) });
			done();
		});
	});

	afterEach( function(done) {
		if ( lib ) lib.dispose();
		closeWindow( win, done );
	});

	function enter( code ) {
		String(code).split("").forEach( function(d, i){ lib.vm["digit" + (i+1)] = d; });
	}

	it('greys and disables Start for an invalid full code', function() {
		enter("123");
		Ti.API.info("[AcademyBtn] invalid enabled=" + ctl.startButton.enabled + " bg=" + ctl.startButton.backgroundColor);
		expect( ctl.startButton.enabled ).to.equal( false );
		expect( ctl.startButton.backgroundColor ).to.equal( Alloy.CFG.colors.disabled );
		// Newer Android paints a disabled button its enabled backgroundColor unless
		// a disabled background is set explicitly — this guards that fix.
		expect( ctl.startButton.backgroundDisabledColor ).to.equal( Alloy.CFG.colors.disabled );
	});

	// The real proof that one keyboard session fills the whole code: a digit in
	// the first box moves the caret on, so the next keystroke lands in the second.
	it('hands the keyboard to the next box once a digit is typed', function(done) {
		var advanced = false;
		ctl.digit2.addEventListener("focus", function(){ advanced = true; });
		enter("1");
		waitFor( function(){ return advanced; } ).then( function(){ done(); }, done );
	});

	it('greens and enables Start for a valid code', function() {
		enter("101");
		Ti.API.info("[AcademyBtn] valid enabled=" + ctl.startButton.enabled + " bg=" + ctl.startButton.backgroundColor);
		expect( ctl.startButton.enabled ).to.equal( true );
		expect( ctl.startButton.backgroundColor ).to.equal( Alloy.CFG.colors.success );
	});

	it('reverts Start to the disabled look when a valid code is edited to an invalid one', function() {
		enter("101");            // valid → green + enabled
		lib.vm.digit3 = "2";     // "101" → "102" (invalid)
		Ti.API.info("[AcademyBtn] valid→invalid enabled=" + ctl.startButton.enabled + " bg=" + ctl.startButton.backgroundColor);
		expect( ctl.startButton.enabled ).to.equal( false );
		expect( ctl.startButton.backgroundColor ).to.equal( Alloy.CFG.colors.disabled );
	});
});

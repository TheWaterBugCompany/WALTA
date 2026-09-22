require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, windowOpenTest, closeWindow } = require('spec/util/TestUtils');
var { View } = require("logic/View");
var { makeTestServices } = require("spec/fixtures/Services_fixture");

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

	it('renders the modal with the belts and buttons', function() {
		expect( ctl.currentBelt ).to.exist;
		expect( ctl.nextBelt ).to.exist;
		expect( ctl.startButton ).to.exist;
		expect( ctl.cancelButton ).to.exist;
	});

});

// Drives the real ViewModel + bindView onto the Alloy widgets the way
// View.openModal does, so the belts render and the Start button's enabled
// state and colour reflect whether the next course has been written — the
// shell-only describe above can't exercise that.
describe('Academy belt levels', function() {
	var makeBinder = require('util/bindView').makeBinder;
	var createAcademy = require('mvvm/controllers/Academy');
	var createTraining = require('logic/Training');
	var createTrainingExercises = require('logic/TrainingExercises');
	var Belts = require('logic/Belts');

	var host, ctl, win, lib;

	function openAt( level ) {
		return new Promise( function(resolve) {
			host = new View(makeTestServices());
			ctl = Alloy.createController("Academy");
			win = wrapViewInWindow( ctl.getView() );
			var exercises = createTrainingExercises({ "101": { beltLevel: 1, taxa: [90,198,176,131] } });
			var topics = { fireTopicEvent: function(){}, TRAININGTRAY: "s" };
			var repo = { startSession: function(){ return { length: 0, taxa: function(){ return []; } }; },
			             currentSessionCode: function(){ return null; } };
			var services = {
				Training: createTraining({ topics: topics, repo: repo, exercises: exercises }),
				belts: { currentLevel: function(){ return level; } },
				topics: topics
			};
			lib = createAcademy({
				view: ctl,
				close: function(){},
				services: services,
				bindView: makeBinder(function(name, a) { return host.createComponent(name, a); }, Alloy.CFG.colors)
			});
			windowOpenTest( win, resolve );
		});
	}

	// Close before disposing: disposing unmounts the belts, so a teardown that
	// ran the other way round would leave the screen bare for anyone looking at
	// it (and for a screenshot taken in --manual).
	afterEach( async function() {
		await closeWindow( win );
		if ( lib ) lib.dispose();
	});

	it('names the belt held and the one the next course earns', async function() {
		await openAt( 0 );
		expect( ctl.currentMessage.text ).to.equal("You are currently a white belt:");
		expect( ctl.nextMessage.text ).to.equal("Complete your next course to earn a white with yellow tip belt:");
	});

	it('draws a belt for each', async function() {
		await openAt( 0 );
		expect( ctl.currentBelt.children.length ).to.equal( 1 );
		expect( ctl.nextBelt.children.length ).to.equal( 1 );
	});

	// A belt the user cannot see is the bug this screen is most likely to have:
	// the first one is white on a white modal, so only its outline says it is
	// there at all. Pin that it is laid out with a real frame.
	it('gives each belt a frame with width and height', async function() {
		await openAt( 0 );
		var current = ctl.currentBelt.children[0];
		expect( current.rect.width, "belt width" ).to.be.greaterThan( 0 );
		expect( current.rect.height, "belt height" ).to.be.greaterThan( 0 );
	});

	it('greens and enables Start when the next course has been written', async function() {
		await openAt( 0 );
		expect( ctl.startButton.enabled ).to.equal( true );
		expect( ctl.startButton.backgroundColor ).to.equal( Alloy.CFG.colors.success );
	});

	it('greys and disables Start when the next course is unwritten', async function() {
		await openAt( 1 );
		expect( ctl.startButton.enabled ).to.equal( false );
		expect( ctl.startButton.backgroundColor ).to.equal( Alloy.CFG.colors.disabled );
		// Newer Android paints a disabled button its enabled backgroundColor unless
		// a disabled background is set explicitly — this guards that fix.
		expect( ctl.startButton.backgroundDisabledColor ).to.equal( Alloy.CFG.colors.disabled );
	});

	it('drops the next belt once the highest is held', async function() {
		await openAt( Belts.HIGHEST );
		expect( ctl.nextMessage.visible ).to.equal( false );
		expect( ctl.nextBelt.visible ).to.equal( false );
	});
});

require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { closeWindow, controllerOpenTest, actionFiresTopicTest, setManualTests } = require('spec/util/TestUtils');

var Question = require('logic/Question');
var Key = require('logic/Key');
var Topics = require('ui/Topics');

function makeTestKey() {
	return Key.createKey( {
		url: 'https://example.com/',
		name: 'TestTaxonomy',
		root: Key.createKeyNode({
			parentLink: {}, // suppress isRoot
			questions: [
				Question.createQuestion( {
					outcome: 1,
					text: "This is a test question text! With an longer question text that needs to wrap plus a couple of media images",
					mediaUrls: [ '/spec/resources/simpleKey1/media/amphipoda_01.jpg' ]
				}),
				Question.createQuestion( {
					outcome: 1,
					text: "This is the a second test question",
					mediaUrls: [
						"/spec/resources/simpleKey1/media/amphipoda_02.jpg",
						"/spec/resources/simpleKey1/media/attack_caddis_01_x264.mp4"
					]
				})
			]
		})
	});
}

function anchorImages(ctl) {
	return ctl.getAnchorBar().leftTools.children.map(function(c) { return c.image; });
}

describe('KeySearch controller', function() {
	var knv;
	before( function(done) {
		var key = makeTestKey();
		knv = Alloy.createController("KeySearch", { node: key.getCurrentNode(), key: key });
		controllerOpenTest( knv, done );
	});
	after( function(done) {
			closeWindow( knv.getView(), done );
	})

	it('should fire the FORWARD topic', function(done) {
		actionFiresTopicTest( knv.questions[1].Question, 'click', Topics.FORWARD, () => done() );
	});

	it('should fire the UP topic', function(done) {
		actionFiresTopicTest( knv.header, 'click', Topics.UP, () => done() );
	});

});

// The key is the only allowed identification path during a training assessment, so
// the anchor-bar speedbug/browse shortcuts (a way to slip past the greyed
// MethodSelect and cheat) must not be offered when the key is opened in training.
describe('KeySearch training gating', function() {
	context('in a survey', function() {
		var ctl;
		before( function(done) {
			var key = makeTestKey();
			ctl = Alloy.createController("KeySearch", { node: key.getCurrentNode(), key: key });
			controllerOpenTest( ctl, done );
		});
		after( function(done) { closeWindow( ctl.getView(), done ); });

		it('offers the speedbug and browse shortcuts', function() {
			var imgs = anchorImages( ctl );
			expect( imgs ).to.include( '/images/icon-speedbug-white.png' );
			expect( imgs ).to.include( '/images/icon-browse-white.png' );
		});
	});

	context('in training mode', function() {
		var ctl;
		before( function(done) {
			var key = makeTestKey();
			ctl = Alloy.createController("KeySearch", { node: key.getCurrentNode(), key: key, training: true });
			controllerOpenTest( ctl, done );
		});
		after( function(done) { closeWindow( ctl.getView(), done ); });

		it('hides the speedbug and browse shortcuts so the key is the only path', function() {
			var imgs = anchorImages( ctl );
			expect( imgs ).to.not.include( '/images/icon-speedbug-white.png' );
			expect( imgs ).to.not.include( '/images/icon-browse-white.png' );
		});
	});
});

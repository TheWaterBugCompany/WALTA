require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { closeWindow, controllerOpenTest, waitForTopic } = require('spec/util/TestUtils');
var { View } = require("logic/View");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var { makeBinder } = require("util/bindView");
var createKeySearch = require("mvvm/controllers/KeySearch");

var Question = require('logic/Question');
var Key = require('logic/Key');
var Taxon = require('logic/Taxon');
var Topics = require('ui/Topics');

// A root couplet whose branches lead to two taxa, so a hint can name one of them
// as the right answer.
function makeTestKey() {
	var key = Key.createKey({ url: 'https://example.com/', name: 'TestTaxonomy' });
	var shelled = Taxon.createTaxon({ id: 'shelled', taxonId: '1', name: 'Shelled' });
	var unshelled = Taxon.createTaxon({ id: 'unshelled', taxonId: '2', name: 'Unshelled' });
	[shelled, unshelled].forEach(function(t) { key.attachTaxon(t); });
	var root = Key.createKeyNode({
		id: 'root',
		questions: [
			Question.createQuestion({ text: "Animal with a shell (snails and mussels)", mediaUrls: [ '/spec/resources/simpleKey1/media/amphipoda_01.jpg' ] }),
			Question.createQuestion({ text: "Animal without a shell", mediaUrls: [ '/spec/resources/simpleKey1/media/amphipoda_02.jpg' ] }),
		],
	});
	key.setRootNode(root);
	key.linkTaxonToParent(root, 0, shelled);
	key.linkTaxonToParent(root, 1, unshelled);
	return key;
}

// Drives the real screen — the Alloy presenter, the screen controller, and the
// branch collection binding that builds real Question components through the
// View seam — so the on-device rendering of the hint is exercised. The gating
// logic itself is covered in Node (test/viewmodels/KeySearch_spec.js).
describe('KeySearch controller', function() {
	var host, knv, ctl, key;

	function open(args) {
		return new Promise(function(resolve) {
			host = new View(makeTestServices());
			key = makeTestKey();
			args = _({ node: key.getRootNode(), key: key }).extend(args || {});
			knv = Alloy.createController("KeySearch", args);
			ctl = createKeySearch({
				view: knv,
				close: function() {},
				services: { topics: Topics },
				bindView: makeBinder(function(name, a) { return host.createComponent(name, a); }, Alloy.CFG.colors),
				args: args
			});
			controllerOpenTest( knv, resolve );
		});
	}

	function branches() {
		return knv.questions.children;
	}

	// Each Question component is a hint frame holding the verdict icon and the card.
	function card(index) { return branches()[index].children[1]; }
	function verdictIcon(index) { return branches()[index].children[0]; }

	afterEach( async function() {
		await closeWindow( knv.getView() );
		if ( ctl ) ctl.dispose();
	});

	it('shows a card for each branch of the couplet', async function() {
		await open();
		expect( branches().length ).to.equal(2);
	});

	it('fires the FORWARD topic when a branch is chosen', async function() {
		await open();
		var data = await waitForTopic( Topics.FORWARD, function() { card(1).fireEvent('click', { x: 0, y: 0 }); } );
		expect( data.node.id ).to.equal('unshelled');
	});

	it('fires the UP topic from the up button', async function() {
		await open();
		key.choose(0);
		await closeWindow( knv.getView() );
		ctl.dispose();
		await open({ node: key.getRootNode() });
		expect( knv.upButton.visible ).to.equal(false);
	});

	it('marks the hinted branches with a tick and a cross', async function() {
		await open({ hint: { nodeId: 'root', correctRef: 'unshelled', incorrectRef: 'shelled' } });
		expect( verdictIcon(0).image ).to.equal('/images/cross-icon.png');
		expect( verdictIcon(1).image ).to.equal('/images/tick-icon.png');
		expect( verdictIcon(0).visible ).to.equal(true);
		expect( verdictIcon(1).visible ).to.equal(true);
	});

	it('outlines the hinted branches in the verdict colours', async function() {
		await open({ hint: { nodeId: 'root', correctRef: 'unshelled', incorrectRef: 'shelled' } });
		expect( branches()[0].borderColor ).to.equal(Alloy.CFG.colors.errorDark);
		expect( branches()[1].borderColor ).to.equal(Alloy.CFG.colors.success);
	});

	it('leaves the branches unmarked when the hint names another couplet', async function() {
		await open({ hint: { nodeId: 'somewhere-else', correctRef: 'unshelled', incorrectRef: 'shelled' } });
		expect( verdictIcon(0).visible ).to.equal(false);
		expect( verdictIcon(1).visible ).to.equal(false);
	});
});

// The key is the only allowed identification path during a training assessment, so
// the anchor-bar speedbug/browse shortcuts (a way to slip past the greyed
// MethodSelect and cheat) must not be offered when the key is opened in training.
describe('KeySearch training gating', function() {
	var ctl;

	function anchorImages(c) {
		return c.getAnchorBar().leftTools.children.map(function(child) { return child.image; });
	}

	function open(args) {
		return new Promise(function(resolve) {
			var key = makeTestKey();
			ctl = Alloy.createController("KeySearch", _({ node: key.getRootNode(), key: key }).extend(args || {}));
			controllerOpenTest( ctl, resolve );
		});
	}

	afterEach( async function() { await closeWindow( ctl.getView() ); });

	it('offers the speedbug and browse shortcuts in a survey', async function() {
		await open();
		var imgs = anchorImages( ctl );
		expect( imgs ).to.include( '/images/icon-speedbug-white.png' );
		expect( imgs ).to.include( '/images/icon-browse-white.png' );
	});

	it('hides the speedbug and browse shortcuts in training mode', async function() {
		await open({ training: true });
		var imgs = anchorImages( ctl );
		expect( imgs ).to.not.include( '/images/icon-speedbug-white.png' );
		expect( imgs ).to.not.include( '/images/icon-browse-white.png' );
	});
});

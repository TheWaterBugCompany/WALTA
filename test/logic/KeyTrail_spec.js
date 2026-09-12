require("mocha");
const { expect } = require("chai");

const Key = require("logic/Key");
const Question = require("logic/Question");
const Taxon = require("logic/Taxon");
const createKeyTrail = require("logic/KeyTrail");

// The couplets the reader actually walked through on the way to an
// identification. The key is a DAG, so a node's single parentLink cannot answer
// "how did you get here?" — only a record of the walk can.
//
//              n1 (root)
//            /          \
//          n2            n3
//         /  \          /  \
//       t1    shared <-'    t4
//             /    \
//           t2      t3
//
function buildKey() {
	const key = Key.createKey({ url: "https://example.com", name: "WALTA" });

	const taxa = {};
	["t1", "t2", "t3", "t4"].forEach((id, i) => {
		taxa[id] = Taxon.createTaxon({ id, taxonId: String(i + 1), name: id });
		key.attachTaxon(taxa[id]);
	});

	const couplet = (id) => Key.createKeyNode({
		id,
		questions: [Question.createQuestion({ text: id + "Q1" }), Question.createQuestion({ text: id + "Q2" })],
	});
	const n1 = couplet("n1");
	const n2 = couplet("n2");
	const n3 = couplet("n3");
	const shared = couplet("shared");

	key.setRootNode(n1);
	key.linkNodeToParent(n1, 0, n2);
	key.linkNodeToParent(n1, 1, n3);
	key.linkTaxonToParent(n2, 0, taxa.t1);
	key.linkNodeToParent(n2, 1, shared);
	key.linkTaxonToParent(n3, 0, taxa.t4);
	key.linkNodeToParent(n3, 1, shared);
	key.linkTaxonToParent(shared, 0, taxa.t2);
	key.linkTaxonToParent(shared, 1, taxa.t3);

	return { key, n1, n2, n3, shared, taxa };
}

describe("KeyTrail", function () {
	it("has no route before anything is walked", function () {
		const { key } = buildKey();
		expect(createKeyTrail({ key }).route()).to.equal(null);
	});

	it("records each couplet stepped through", function () {
		const { key, n1, n2, shared } = buildKey();
		const trail = createKeyTrail({ key });
		trail.enter(n1);
		trail.step(n2);
		trail.step(shared);
		expect(trail.route()).to.deep.equal(["n1", "n2", "shared"]);
	});

	// Going up re-opens a couplet already walked, so the trail rewinds to it
	// rather than starting over — the next branch then appends to the real prefix.
	it("rewinds when re-entering a couplet already on the trail", function () {
		const { key, n1, n2, shared } = buildKey();
		const trail = createKeyTrail({ key });
		trail.enter(n1);
		trail.step(n2);
		trail.step(shared);
		trail.enter(n2);
		expect(trail.route()).to.deep.equal(["n1", "n2"]);
	});

	// A jump lands somewhere with no walked history behind it.
	it("starts afresh when entering a couplet not on the trail", function () {
		const { key, n1, n2, n3 } = buildKey();
		const trail = createKeyTrail({ key });
		trail.enter(n1);
		trail.step(n2);
		trail.enter(n3);
		expect(trail.route()).to.deep.equal(["n3"]);
	});

	// The correction jump lands mid-key, so it carries the route that got there.
	// Seeding beats rewinding: the couplet may sit on the live trail with a
	// different prefix than the one being corrected.
	it("takes a seeded route in preference to rewinding to the same couplet", function () {
		const { key, n1, n2, shared } = buildKey();
		const trail = createKeyTrail({ key });
		trail.enter(n1);
		trail.step(n2);
		trail.step(shared);
		trail.enter(shared, ["n1", "n3", "shared"]);
		expect(trail.route()).to.deep.equal(["n1", "n3", "shared"]);
	});

	it("reports the couplet a node was walked in from", function () {
		const { key, n1, n2, shared } = buildKey();
		const trail = createKeyTrail({ key });
		trail.enter(n1);
		trail.step(n2);
		trail.step(shared);
		expect(trail.parentOf(shared)).to.equal(n2);
		expect(trail.parentOf(n1)).to.equal(null);
	});

	it("does not know the parent of a node it never walked", function () {
		const { key, n1, n3 } = buildKey();
		const trail = createKeyTrail({ key });
		trail.enter(n1);
		expect(trail.parentOf(n3)).to.equal(null);
	});

	// Ten existing KeySearch specs build without a trail, so the do-nothing trail
	// has to behave like one that was never walked.
	it("offers a do-nothing trail that records nothing", function () {
		createKeyTrail.none.enter({ id: "n1" });
		createKeyTrail.none.step({ id: "n2" });
		expect(createKeyTrail.none.route()).to.equal(null);
		expect(createKeyTrail.none.parentOf({ id: "n2" })).to.equal(null);
	});
});

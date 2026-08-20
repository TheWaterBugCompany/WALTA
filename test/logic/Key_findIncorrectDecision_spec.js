require("mocha");
const { expect } = require("chai");

const Key = require("logic/Key");
const Question = require("logic/Question");
const Taxon = require("logic/Taxon");

// Build a small key:
//
//            n1 (root)
//          /      \
//        q0        q1
//         |         |
//        n2         t3
//       /  \
//      q0   q1
//      |     |
//      t1    t2
//
function buildKey() {
	const key = Key.createKey({ url: "https://example.com", name: "WALTA" });

	const t1 = Taxon.createTaxon({ id: "t1", taxonId: "1", name: "Taxon 1" });
	const t2 = Taxon.createTaxon({ id: "t2", taxonId: "2", name: "Taxon 2" });
	const t3 = Taxon.createTaxon({ id: "t3", taxonId: "3", name: "Taxon 3" });
	[t1, t2, t3].forEach((t) => key.attachTaxon(t));

	const n1 = Key.createKeyNode({
		id: "n1",
		questions: [Question.createQuestion({ text: "Q1" }), Question.createQuestion({ text: "Q2" })],
	});
	const n2 = Key.createKeyNode({
		id: "n2",
		questions: [Question.createQuestion({ text: "Q3" }), Question.createQuestion({ text: "Q4" })],
	});

	key.setRootNode(n1);
	key.linkNodeToParent(n1, 0, n2);
	key.linkTaxonToParent(n1, 1, t3);
	key.linkTaxonToParent(n2, 0, t1);
	key.linkTaxonToParent(n2, 1, t2);

	return { key, t1, t2, t3, n1, n2 };
}

describe("Key.findIncorrectDecision", function () {
	it("returns the deepest shared node when the leaves are siblings", function () {
		const { key } = buildKey();
		expect(key.findIncorrectDecision("t1", "t2")).to.equal("n2");
	});

	it("returns the root when the paths diverge at the first couplet", function () {
		const { key } = buildKey();
		expect(key.findIncorrectDecision("t1", "t3")).to.equal("n1");
	});

	it("is independent of argument order", function () {
		const { key } = buildKey();
		expect(key.findIncorrectDecision("t3", "t1")).to.equal("n1");
	});

	it("returns null when the selected and expected taxa are the same", function () {
		const { key } = buildKey();
		expect(key.findIncorrectDecision("t1", "t1")).to.equal(null);
	});
});

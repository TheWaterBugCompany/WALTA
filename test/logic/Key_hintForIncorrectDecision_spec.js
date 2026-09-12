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

// The hint the key search shows over a couplet: which couplet, and which of its
// two outcomes was right. KeySearch matches these against question.outcome.id,
// so they name the nodes either side of where the two identifications part.
describe("Key.hintForIncorrectDecision", function () {
	it("names the couplet and both of its outcomes when the leaves are siblings", function () {
		const { key } = buildKey();
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "1", expectedTaxonId: "2" }))
			.to.deep.equal({ nodeId: "n2", correctRef: "t2", incorrectRef: "t1" });
	});

	it("names the couplet higher up when the paths part earlier", function () {
		const { key } = buildKey();
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "1", expectedTaxonId: "3" }))
			.to.deep.equal({ nodeId: "n1", correctRef: "t3", incorrectRef: "n2" });
	});

	// The refs are not interchangeable: which one is correct depends on which
	// taxon was expected, and swapping them would mark the wrong branch green.
	it("swaps the outcomes when the answers are swapped", function () {
		const { key } = buildKey();
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "3", expectedTaxonId: "1" }))
			.to.deep.equal({ nodeId: "n1", correctRef: "n2", incorrectRef: "t3" });
	});

	it("returns null when the selected and expected taxa are the same", function () {
		const { key } = buildKey();
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "1", expectedTaxonId: "1" })).to.equal(null);
	});

	// Exercises author taxonIds as numbers; the key yields them as strings.
	it("matches taxonIds across the two id spaces", function () {
		const { key } = buildKey();
		expect(key.hintForIncorrectDecision({ selectedTaxonId: 1, expectedTaxonId: 2 }))
			.to.deep.equal({ nodeId: "n2", correctRef: "t2", incorrectRef: "t1" });
	});
});

describe("Key.hintForIncorrectDecision where a node has two parents", function () {
	// `shared` is reachable from both n2 and n3, so t2 sits at the end of two
	// routes — but its parentLink holds only n3, the one linked last. This is the
	// shape the shipped key has around the damselflies, which are reachable both
	// from the odonata branch and from the mayfly one.
	//
	//              n1 (root)
	//            /          \
	//          n2            n3
	//         /  \          /  \
	//       t1    shared <-'    t4
	//             /    \
	//           t2      t3
	//
	function buildTwoParents() {
		const key = Key.createKey({ url: "https://example.com", name: "WALTA" });

		const t1 = Taxon.createTaxon({ id: "t1", taxonId: "1", name: "Taxon 1" });
		const t2 = Taxon.createTaxon({ id: "t2", taxonId: "2", name: "Taxon 2" });
		const t3 = Taxon.createTaxon({ id: "t3", taxonId: "3", name: "Taxon 3" });
		const t4 = Taxon.createTaxon({ id: "t4", taxonId: "4", name: "Taxon 4" });
		[t1, t2, t3, t4].forEach((t) => key.attachTaxon(t));

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
		key.linkTaxonToParent(n2, 0, t1);
		key.linkNodeToParent(n2, 1, shared);
		key.linkTaxonToParent(n3, 0, t4);
		key.linkNodeToParent(n3, 1, shared);
		key.linkTaxonToParent(shared, 0, t2);
		key.linkTaxonToParent(shared, 1, t3);

		return { key };
	}

	// The reader walked n1→n2 and picked t1. t2 is reachable from n2 as well, so
	// the question they got wrong is n2's — not n1's, which they answered
	// correctly and which walking parentLink back up from t2 would have blamed.
	it("names the couplet on the route the reader could have taken, not the one parentLink holds", function () {
		const { key } = buildTwoParents();
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "1", expectedTaxonId: "2" }))
			.to.deep.equal({ nodeId: "n2", correctRef: "shared", incorrectRef: "t1" });
	});

	// Coming at it from n3 instead, the couplet that matters is n3's.
	it("names the other parent's couplet for a reader who came that way", function () {
		const { key } = buildTwoParents();
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "4", expectedTaxonId: "2" }))
			.to.deep.equal({ nodeId: "n3", correctRef: "shared", incorrectRef: "t4" });
	});
});

describe("Key.hintForIncorrectDecision where one taxonId sits at two places", function () {
	// The shipped key does this deliberately: a coarse "order level ID" stop and
	// the family below it can be the same creature, so both carry its taxonId.
	// Only one of them survives in the taxonId index, and it need not be the one
	// nearest the reader.
	//
	//            n1 (root)
	//          /      \
	//        q0        q1
	//         |         |
	//        n2       t3 (taxonId 2)   <- shallow, attached last
	//       /  \
	//      t1   t2 (taxonId 2)         <- deep
	//
	function buildDuplicate() {
		const { key, n1, n2, t1 } = buildKey();
		const shallow = Taxon.createTaxon({ id: "t3", taxonId: "2", name: "Same creature, coarser" });
		key.attachTaxon(shallow);
		key.linkTaxonToParent(n1, 1, shallow);
		return { key, n1, n2, t1 };
	}

	it("prefers the position nearest the reader's own answer", function () {
		const { key } = buildDuplicate();
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "1", expectedTaxonId: "2" }))
			.to.deep.equal({ nodeId: "n2", correctRef: "t2", incorrectRef: "t1" });
	});
});

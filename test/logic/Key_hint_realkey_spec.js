require("mocha");
const { expect } = require("chai");
const path = require("path");

const KeyLoaderJson = require("logic/KeyLoaderJson");

// The hint behind "Which question did I get wrong?", exercised against the
// shipped key rather than a fixture — the couplets it has to get right only
// exist because the real key is a DAG, where a taxon can sit at the end of
// several routes and `parentLink` records only one of them.

const KEY_DIR = path.resolve(__dirname, "../../walta-taxonomy/walta") + "/";

describe("Key.hintForIncorrectDecision against the shipped key", function () {
	let key;

	before(function () {
		key = KeyLoaderJson.loadKey(KEY_DIR);
	});

	// Reported defect: the learner walked "with obvious tails" — correct for a
	// damselfly — and was told that was the question they got wrong, because a
	// damselfly is also reachable down the "no obvious tails" branch and that is
	// the route parentLink happens to hold.
	it("names the couplet where a damselfly and a baetid actually part", function () {
		const hint = key.hintForIncorrectDecision({ selectedTaxonId: "90", expectedTaxonId: "131" });

		expect(hint.nodeId).to.equal("old_mayfly_start_point");
		expect(hint.incorrectRef).to.equal("order_ephemeroptera");
		expect(hint.correctRef).to.equal("k_odonata");
	});

	it("returns no hint when the two identifications are the same taxon", function () {
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "90", expectedTaxonId: "90" })).to.equal(null);
	});

	// The acceptance scenario walks this pair, and its expected couplet is baked
	// into the driver's route — so a change here breaks the suite, not just a hint.
	it("still parts a limpet and a mussel at the molluscs couplet", function () {
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "184", expectedTaxonId: "179" }))
			.to.deep.equal({ nodeId: "k_mollusca", correctRef: "order_bivalvia", incorrectRef: "order_gastropoda" });
	});

	// taxonId 179 sits at two places — the class-level "mussels" stop and the
	// Hyriidae leaf below it. Against another bivalve the deeper one is the
	// useful answer, whichever of the two the taxonId index happens to hold.
	it("hints from the deeper of two positions sharing a taxonId", function () {
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "180", expectedTaxonId: "179" }))
			.to.deep.equal({ nodeId: "k_bivalvia", correctRef: "hyriidae", incorrectRef: "sphaeriidae_and_corbiculidae" });
	});
});

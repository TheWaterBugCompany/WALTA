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
			.to.deep.equal({ nodeId: "k_mollusca", correctRef: "order_bivalvia", incorrectRef: "order_gastropoda",
				route: ["root", "k_mollusca"] });
	});

	// taxonId 179 sits at two places — the class-level "mussels" stop and the
	// Hyriidae leaf below it. Against another bivalve the deeper one is the
	// useful answer, whichever of the two the taxonId index happens to hold.
	it("hints from the deeper of two positions sharing a taxonId", function () {
		expect(key.hintForIncorrectDecision({ selectedTaxonId: "180", expectedTaxonId: "179" }))
			.to.deep.equal({ nodeId: "k_bivalvia", correctRef: "hyriidae", incorrectRef: "sphaeriidae_and_corbiculidae",
				route: ["root", "k_mollusca", "order_bivalvia", "k_bivalvia"] });
	});

	// Maggots are reachable from either side of the worm-like couplet, so which
	// question the reader got wrong depends on which way they came — something no
	// amount of looking at the key can work out on its own.
	describe("when the reader's own route is known", function () {
		const VIA_91 = ["root", "node_1", "k_worm_like", "node_89", "node_91", "order_diptera", "diptera"];
		const VIA_92 = ["root", "node_1", "k_worm_like", "node_89", "node_92", "order_diptera", "diptera"];

		it("names the couplet on the route the reader took", function () {
			expect(key.hintForIncorrectDecision({
				selectedTaxonId: "69", expectedTaxonId: "176", selectedRoute: VIA_92,
			}).nodeId).to.equal("node_89");
		});

		it("names a different couplet for the reader who came the other way", function () {
			expect(key.hintForIncorrectDecision({
				selectedTaxonId: "69", expectedTaxonId: "176", selectedRoute: VIA_91,
			}).nodeId).to.equal("node_91");
		});

		// Without one it can only guess, and guesses the most specific couplet.
		it("falls back to the most specific couplet when no route was recorded", function () {
			expect(key.hintForIncorrectDecision({ selectedTaxonId: "69", expectedTaxonId: "176" }).nodeId)
				.to.equal("node_91");
		});

		// A route stored before a taxonomy edit no longer traces real edges. It
		// matches nothing, so it is ignored rather than needing to be validated.
		it("ignores a route that no longer traces the key", function () {
			expect(key.hintForIncorrectDecision({
				selectedTaxonId: "69", expectedTaxonId: "176", selectedRoute: ["root", "gone", "vanished"],
			}).nodeId).to.equal("node_91");
		});

		// The correction jump needs to hand the next walk the route that got there.
		it("reports the route it hinted from, root down to the couplet", function () {
			expect(key.hintForIncorrectDecision({
				selectedTaxonId: "69", expectedTaxonId: "176", selectedRoute: VIA_92,
			}).route).to.deep.equal(["root", "node_1", "k_worm_like", "node_89"]);
		});
	});
});

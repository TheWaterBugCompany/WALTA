// The set of screens the visual-regression suite captures. Each entry owns its
// own fixture setup in create() — reusing the same mocks the device specs use —
// so adding a screen is a single entry here, and the capture runner stays
// fixture-agnostic. Lives under spec/ because it reuses spec/mocks and is only
// bundled into test builds (same as the mocha runner).
//
// settle overrides the default frame-stability gate for screens that need longer
// (lazy tiles, async photos). Omit for static screens.
var Taxon = require("logic/Taxon");

function menu() {
	var CerdiApi = require("spec/mocks/MockCerdiApi");
	Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi(Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret);
	return Alloy.createController("Menu", { unknown_bug: true });
}

function speedbug() {
	var { speedBugIndexMock } = require("spec/mocks/MockSpeedbug");
	var { keyMock } = require("spec/mocks/MockKey");
	keyMock.addSpeedbugIndex(speedBugIndexMock);
	Alloy.Globals.Key = keyMock;
	return Alloy.createController("Speedbug", { key: keyMock });
}

function taxonDetails() {
	return Alloy.createController("TaxonDetails", {
		node: Taxon.createTaxon({
			id: "testTaxon",
			name: "Family Palaemonidae, Genus Macrobrachium",
			commonName: "Freshwater prawn",
			scientificName: [
				{ taxonomicLevel: "phylum", name: "Arthropoda" },
				{ taxonomicLevel: "family", name: "Palaemonidae" },
				{ taxonomicLevel: "genus", name: "Macrobrachium" }
			],
			size: 300,
			habitat: "Crayfish in rivers (upper photo) yabbies in wetlands/pools (lower photo).",
			movement: "walking, with sudden flips when disturbed.",
			confusedWith: "Nothing, very distinctive.",
			signalScore: 4,
			description: "Random text at the end. Lorem ipsum etc.",
			mediaUrls: [
				"/spec/resources/simpleKey1/media/amphipoda_01.jpg",
				"/spec/resources/simpleKey1/media/amphipoda_02.jpg"
			]
		})
	});
}

module.exports = [
	{ name: "Menu", create: menu },
	{ name: "Speedbug", create: speedbug },
	{ name: "TaxonDetails", create: taxonDetails },
];

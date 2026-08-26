// The set of screens the visual-regression suite captures. Each entry owns its
// own fixture setup in args() — reusing the same mocks the device specs use —
// so adding a screen is a single entry here, and the capture runner stays
// fixture-agnostic. args() seeds whatever the screen binds to and returns the
// open arguments; the runner opens it through the View seam, so MVVM screens get
// the screen controller that builds their view-model. Building the Alloy shell
// alone renders an empty window (the tray is entirely view-model driven).
// Lives under spec/ because it reuses spec/mocks and is only bundled into test
// builds (same as the mocha runner).
//
// settle overrides the default frame-stability gate for screens that need longer
// (lazy tiles, async photos). Omit for static screens.
var Taxon = require("logic/Taxon");
var { SURVEY_DETAILED } = require("logic/Sample");

// A fixed completion date so the survey screens that render a date don't drift
// day to day (which would read as a diff on every run).
var FIXED_DATE = new Date("2020-01-02T00:00:00Z").getTime();

function freshSample() {
	// resetSample instantiates the sample + taxa Models/Collections that the
	// survey screens bind to (SampleTray listens on Alloy.Collections.taxa).
	require("spec/util/TestUtils").resetSample();
	var sample = Alloy.Models.instance("sample");
	sample.clear();
	return sample;
}

function menu() {
	var CerdiApi = require("spec/mocks/MockCerdiApi");
	Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi(Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret);
	return { unknown_bug: true };
}

function speedbug() {
	var { speedBugIndexMock } = require("spec/mocks/MockSpeedbug");
	var { keyMock } = require("spec/mocks/MockKey");
	keyMock.addSpeedbugIndex(speedBugIndexMock);
	Alloy.Globals.Key = keyMock;
	return { key: keyMock };
}

function cerdiApiGlobal() {
	var CerdiApi = require("spec/mocks/MockCerdiApi");
	Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi(Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret);
}

function logIn() {
	cerdiApiGlobal();
	return {};
}

function register() {
	cerdiApiGlobal();
	return {};
}

function taxonList() {
	var KeyLoaderJson = require("logic/KeyLoaderJson");
	var key = KeyLoaderJson.loadKey(Ti.Filesystem.resourcesDirectory + "/spec/resources/simpleKey1/");
	return { key: key };
}

function gallery() {
	var mediaResource = "spec/resources/simpleKey1/media/";
	return {
		photos: [mediaResource + "amphipoda_01.jpg", mediaResource + "amphipoda_02.jpg", mediaResource + "amphipoda_03.jpg"]
	};
}

function siteDetails() {
	var sample = freshSample();
	// fixed coords so the location label is deterministic
	sample.set("lng", "147.671339");
	sample.set("lat", "-42.890748");
	sample.set("surveyType", SURVEY_DETAILED);
	return { sample: sample };
}

function habitat() {
	return { sample: freshSample() };
}

// A tray with nothing in it is an empty grid, which tells a reviewer nothing —
// seed a spread of taxa so the capture shows real silhouettes and abundances.
var TRAYED_TAXA = [
	{ taxonId: "1", abundance: "1-2" },
	{ taxonId: "2", abundance: "3-5" },
	{ taxonId: "3", abundance: "6-10" },
	{ taxonId: "4", abundance: "11-20" },
	{ taxonId: "5", abundance: "> 20" },
];

function sampleTray() {
	var { speedBugIndexMock } = require("spec/mocks/MockSpeedbug");
	var { keyMock } = require("spec/mocks/MockKey");
	keyMock.addSpeedbugIndex(speedBugIndexMock);
	Alloy.Globals.Key = keyMock;
	var sample = freshSample();
	sample.set("surveyType", SURVEY_DETAILED);
	var taxa = Alloy.Collections.instance("taxa");
	TRAYED_TAXA.forEach(function (t) { taxa.add(Alloy.createModel("taxa", t)); });
	return { key: keyMock, taxa: taxa, sample: sample };
}

function notes() {
	var sample = freshSample();
	sample.set("complete", true);
	sample.set("notes", "Sample notes for the visual baseline.");
	sample.set("dateCompleted", FIXED_DATE);
	sample.set("overrideDateCompleted", FIXED_DATE);
	return { sample: sample };
}

function summary() {
	var sample = freshSample();
	// Without coords the screen shows a red "no GPS lock yet" banner, which comes
	// and goes with the host's location state — fixed here so the capture doesn't drift.
	sample.set("lng", "147.671339");
	sample.set("lat", "-42.890748");
	sample.set("waterbodyName", "Test Waterbody");
	sample.set("nearbyFeature", "near the old bridge");
	sample.set("dateCompleted", FIXED_DATE);
	sample.set("surveyType", 0);
	sample.calculateSignalScore = function () { return "3.0"; };
	sample.calculateWeightedSignalScore = function () { return "3.5"; };
	sample.saveCurrentSample = function () {};
	sample.loadTaxa = function () { return []; };
	cerdiApiGlobal();
	return { sample: sample };
}

// About/Help render their content in a WebView. Framebuffer capture (the default)
// handles this — the host screenshots the real screen, which includes WebView
// content view.toImage() can't see.
function about() {
	return { keyUrl: Ti.Filesystem.resourcesDirectory + "taxonomy/walta/" };
}

function help() {
	return { keyUrl: Ti.Filesystem.resourcesDirectory + "taxonomy/walta/" };
}

function taxonDetails() {
	return {
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
	};
}

module.exports = [
	{ name: "Menu", args: menu },
	{ name: "Speedbug", args: speedbug },
	{ name: "TaxonDetails", args: taxonDetails },
	{ name: "TaxonList", args: taxonList },
	{ name: "Gallery", args: gallery },
	{ name: "LogIn", args: logIn },
	{ name: "Register", args: register },
	{ name: "SiteDetails", args: siteDetails },
	{ name: "Habitat", args: habitat },
	{ name: "SampleTray", args: sampleTray },
	{ name: "Notes", args: notes },
	{ name: "Summary", args: summary },
	// loadMs gives the WebView's local HTML time to render before the host grabs
	// the frame (framebuffer is the default capture — see captureScreens.js).
	{ name: "About", args: about, loadMs: 2000 },
	{ name: "Help", args: help, loadMs: 2000 },
];

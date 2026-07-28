// The set of screens the visual-regression suite captures. Each entry owns its
// own fixture setup in create() — reusing the same mocks the device specs use —
// so adding a screen is a single entry here, and the capture runner stays
// fixture-agnostic. Lives under spec/ because it reuses spec/mocks and is only
// bundled into test builds (same as the mocha runner).
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
	return Alloy.createController("Menu", { unknown_bug: true });
}

function speedbug() {
	var { speedBugIndexMock } = require("spec/mocks/MockSpeedbug");
	var { keyMock } = require("spec/mocks/MockKey");
	keyMock.addSpeedbugIndex(speedBugIndexMock);
	Alloy.Globals.Key = keyMock;
	return Alloy.createController("Speedbug", { key: keyMock });
}

function cerdiApiGlobal() {
	var CerdiApi = require("spec/mocks/MockCerdiApi");
	Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi(Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret);
}

function logIn() {
	cerdiApiGlobal();
	return Alloy.createController("LogIn");
}

function register() {
	cerdiApiGlobal();
	return Alloy.createController("Register");
}

function taxonList() {
	var KeyLoaderJson = require("logic/KeyLoaderJson");
	var key = KeyLoaderJson.loadKey(Ti.Filesystem.resourcesDirectory + "/spec/resources/simpleKey1/");
	return Alloy.createController("TaxonList", { key: key });
}

function gallery() {
	var mediaResource = "spec/resources/simpleKey1/media/";
	return Alloy.createController("Gallery", {
		photos: [mediaResource + "amphipoda_01.jpg", mediaResource + "amphipoda_02.jpg", mediaResource + "amphipoda_03.jpg"]
	});
}

function siteDetails() {
	var sample = freshSample();
	// fixed coords so the location label is deterministic
	sample.set("lng", "147.671339");
	sample.set("lat", "-42.890748");
	sample.set("surveyType", SURVEY_DETAILED);
	return Alloy.createController("SiteDetails");
}

function habitat() {
	freshSample();
	return Alloy.createController("Habitat");
}

function sampleTray() {
	var { speedBugIndexMock } = require("spec/mocks/MockSpeedbug");
	var { keyMock } = require("spec/mocks/MockKey");
	keyMock.addSpeedbugIndex(speedBugIndexMock);
	Alloy.Globals.Key = keyMock;
	freshSample();
	return Alloy.createController("SampleTray", { key: keyMock });
}

function notes() {
	var sample = freshSample();
	sample.set("complete", true);
	sample.set("notes", "Sample notes for the visual baseline.");
	sample.set("dateCompleted", FIXED_DATE);
	sample.set("overrideDateCompleted", FIXED_DATE);
	return Alloy.createController("Notes");
}

function summary() {
	var sample = freshSample();
	sample.set("waterbodyName", "Test Waterbody");
	sample.set("nearbyFeature", "near the old bridge");
	sample.set("dateCompleted", FIXED_DATE);
	sample.set("surveyType", 0);
	sample.calculateSignalScore = function () { return "3.0"; };
	sample.calculateWeightedSignalScore = function () { return "3.5"; };
	sample.saveCurrentSample = function () {};
	sample.loadTaxa = function () { return []; };
	cerdiApiGlobal();
	return Alloy.createController("Summary");
}

// About/Help render their content in a WebView. Framebuffer capture (the default)
// handles this — the host screenshots the real screen, which includes WebView
// content view.toImage() can't see.
function about() {
	return Alloy.createController("About", { keyUrl: Ti.Filesystem.resourcesDirectory + "taxonomy/walta/" });
}

function help() {
	return Alloy.createController("Help", { keyUrl: Ti.Filesystem.resourcesDirectory + "taxonomy/walta/" });
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
	{ name: "TaxonList", create: taxonList },
	{ name: "Gallery", create: gallery },
	{ name: "LogIn", create: logIn },
	{ name: "Register", create: register },
	{ name: "SiteDetails", create: siteDetails },
	{ name: "Habitat", create: habitat },
	{ name: "SampleTray", create: sampleTray },
	{ name: "Notes", create: notes },
	{ name: "Summary", create: summary },
	// loadMs gives the WebView's local HTML time to render before the host grabs
	// the frame (framebuffer is the default capture — see captureScreens.js).
	{ name: "About", create: about, loadMs: 2000 },
	{ name: "Help", create: help, loadMs: 2000 },
];

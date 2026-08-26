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
var FIXED_DATE_VALUE = new Date(2020, 0, 2);

// Longer than any capture run, so a timed overlay stays put rather than fading
// out part-way through one.
var NOTICE_HELD_MS = 600000;

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

// A modal is captured over the screen it is reached from — see openEntry.js.
function methodSelect() {
	return { unknownBug: true };
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

// --- Windows reached from a route -----------------------------------------

function keySearch() {
	var KeyLoaderJson = require("logic/KeyLoaderJson");
	var key = KeyLoaderJson.loadKey(Ti.Filesystem.resourcesDirectory + "/spec/resources/simpleKey1/");
	return { key: key, node: key.getCurrentNode() };
}

function sampleHistory() {
	var { makeSampleData } = require("spec/fixtures/SampleData_fixture");
	var { clearDatabase } = require("spec/util/TestUtils");
	var moment = require("lib/moment");
	// Three entries seed this — the screen plus the two modals hosted on it — and
	// earlier screens leave samples of their own behind. Clear first so the table
	// holds the same rows however often the fixture runs.
	clearDatabase();
	// Fixed completion dates: the rows render them, so a live clock would read as
	// a diff on every run.
	[
		{ serverSampleId: 666, dateCompleted: "2021-06-21T20:23" },
		{ serverSampleId: 667, dateCompleted: "2021-06-21T22:23" },
		{ serverSampleId: 668, dateCompleted: "2021-06-21T23:23" },
	].forEach(function (s) {
		makeSampleData({ serverSampleId: s.serverSampleId, dateCompleted: moment(s.dateCompleted).format() }).save();
	});
	// The rows resolve their owner through the API client; the mock has no user
	// lookup of its own, so pin one rather than reach the network.
	cerdiApiGlobal();
	Alloy.Globals.CerdiApi.retrieveUserId = function () { return 38; };
	return {};
}

function trainingTray() {
	var SampleTrayModel = require("models/SampleTray");
	var TaxonModel = require("models/Taxon");
	var { speedBugIndexMock } = require("spec/mocks/MockSpeedbug");
	var { keyMock } = require("spec/mocks/MockKey");
	keyMock.addSpeedbugIndex(speedBugIndexMock);
	Alloy.Globals.Key = keyMock;
	// A part-filled tray is the interesting one: it shows both identified cells and
	// the empty numbered slots the exercise still expects.
	var tray = new SampleTrayModel(
		[1, 2, 3, 4, 5].map(function (id, i) { return new TaxonModel({ id: id, taxonId: id, position: i }); })
	);
	// The assessment notice fades in, dwells on a timer and fades out again, so
	// whether it lands in a capture is a race. Hold it up for far longer than any
	// capture takes, so the notice is reliably in frame rather than sometimes.
	return { key: keyMock, tray: tray, noticeDwellMs: NOTICE_HELD_MS };
}

// Verdicts only appear once the tray is assessed, and the tray's whole point in
// training is that feedback — so the capture assesses it. The identified taxa
// get a mixed verdict and every cell the exercise still expects is incorrect: an
// empty cell is a taxon the trainee never found, so a tick on one reads as
// nonsense. The mix is a fixed pattern, not a real draw — a baseline that varies
// between runs is a baseline that can't be diffed.
var IDENTIFIED_VERDICTS = ["correct", "incorrect", "correct", "correct", "incorrect"];

function trainingTrayServices() {
	return {
		assessor: {
			expectedCount: 10,
			assess: function (cells) {
				return cells.map(function (cell, i) {
					return cell ? IDENTIFIED_VERDICTS[i % IDENTIFIED_VERDICTS.length] : "incorrect";
				});
			},
		},
	};
}

// A tile's taxa icons are its 2nd child's children, and a cell's verdict overlay
// is its 3rd child — the same accessors TrainingTray_spec uses.
function verdictOverlays(ctl) {
	return ctl.tray.children[0].children[1].children.map(function (cell) { return cell.children[2]; });
}

function assessTrainingTray(opened) {
	var { waitFor } = require("spec/util/TestUtils");
	opened.seam.getScreenController().vm.assess();
	// Wait for the overlays to render, not just for the verdicts to exist: the
	// cells re-apply asynchronously, and the frame-stability gate could otherwise
	// settle on the frame before them.
	var ctl = opened.seam.getCurrentController();
	return waitFor(function () {
		return verdictOverlays(ctl).some(function (v) { return v.visible; })
			&& ctl.incorrectNotice.visible === true;
	});
}

function videoPlayer() {
	return { url: "/spec/resources/simpleKey1/media/test_clip.mp4" };
}

// --- Modals, captured over the screen they are reached from ----------------

// The keypad is the whole point of the screen and only appears once a digit box
// is tapped, so the capture taps one — the same way the training tray assesses
// itself to bring its verdicts up.
function openDigitPicker(opened) {
	var { waitFor } = require("spec/util/TestUtils");
	var academy = opened.seam.getCurrentModal().alloyCtl;
	academy.digit1.fireEvent("click");
	return waitFor(function () { return academy.digitPicker.visible === true; });
}

function academy() {
	return {};
}

// The real Training service over the real repo and the real bundled exercises —
// the Academy screen greys its Start button from them, so a stub would render a
// screen the app never shows.
function academyServices() {
	var TrainingRepository = require("repository/TrainingRepository");
	var createTrainingExercises = require("logic/TrainingExercises");
	var createTraining = require("logic/Training");
	var exercises = createTrainingExercises(
		JSON.parse(Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "training-exercises.json").read().text));
	return { Training: createTraining({ repo: TrainingRepository.open("waterbug_data"), exercises: exercises }) };
}

function trainingSuccess() {
	return { correctCount: 6 };
}

function sampleEditMenu() {
	return { sampleId: 1 };
}

function syncFeedback() {
	var SyncStore = require("models/SyncStore");
	var LogRepository = require("repository/LogRepository");
	var Migrator = require("repository/Migrator");
	var createSyncController = require("spec/fixtures/SyncController_fixture");
	// An isolated, empty log db: the real one carries whatever the device happened
	// to log, which would drift the capture run to run.
	var db = "waterbug_data_visual_syncfeedback";
	Migrator.migrate(db);
	return {
		syncController: createSyncController(SyncStore).syncController,
		logRepository: LogRepository.open(db),
	};
}

// --- Components, hosted in a window of their own ---------------------------

function question() {
	var Question = require("logic/Question");
	return {
		question: Question.createQuestion({
			text: "This is a test question text! With a longer question text that needs to wrap plus a couple of media images",
			mediaUrls: [
				"/spec/resources/simpleKey1/media/amphipoda_01.jpg",
				"/spec/resources/simpleKey1/media/amphipoda_02.jpg",
				"/spec/resources/simpleKey1/media/amphipoda_03.jpg",
			],
		}),
	};
}

function photoSelect() {
	return {
		readonly: true,
		cropPhoto: true,
		aspectFit: false,
		image: [
			"/spec/resources/simpleKey1/media/amphipoda_01.jpg",
			"/spec/resources/simpleKey1/media/amphipoda_02.jpg",
			"/spec/resources/simpleKey1/media/amphipoda_03.jpg",
		],
	};
}

function editTaxon() {
	var { speedBugIndexMock } = require("spec/mocks/MockSpeedbug");
	var { createMockTaxon } = require("spec/mocks/MockTaxon");
	var { keyMock } = require("spec/mocks/MockKey");
	keyMock.addSpeedbugIndex(speedBugIndexMock);
	var taxon = createMockTaxon({ taxonId: "1", abundance: "3-5" });
	Alloy.Collections.taxa = Alloy.createCollection("taxa", [taxon]);
	Alloy.Models.sample = Alloy.createModel("sample");
	Alloy.Models.sample.save();
	return { key: keyMock, sample: Alloy.Models.sample, taxa: Alloy.Collections.taxa, taxonId: "1" };
}

function locationEntry() {
	var sample = freshSample();
	return {
		sample: sample,
		// Inject the fix rather than wait on the host's GPS, which would drift the
		// accuracy readout — and never lock at all on a headless CI emulator.
		getCurrentPosition: function (callback) {
			callback({ coords: { accuracy: 100, latitude: -42.890734, longitude: 147.671216 } });
		},
	};
}

function leafletMap() {
	return {};
}

function iosSurveyDatePicker() {
	return { date: FIXED_DATE_VALUE };
}

// About/Help render their content in a WebView. Framebuffer capture (the default)
// handles this — the host screenshots the real screen, which includes WebView
// content view.toImage() can't see.
// A WebView screen is ready when its page has finished loading. The fixed wait
// this replaces was long enough locally and not on a slower CI runner, which
// captured About and Help blank — and a blank capture blessed as a baseline
// makes every later run of that screen pass while showing nothing.
//
// Both signals are needed. The load event never comes if the page beat us here,
// and document.readyState only reads back synchronously on iOS — Android hands
// it to the callback and returns null.
function htmlLoaded(opened) {
	var ctl = opened.seam.getCurrentController();
	// About is the WebView; Help nests one inside its content view.
	var webview = ctl.htmlView || ctl.content;
	return new Promise(function (resolve) {
		function ready() {
			webview.removeEventListener("load", ready);
			resolve();
		}
		webview.addEventListener("load", ready);
		var loadedAlready = webview.evalJS("document.readyState", function (state) {
			if (/complete/.test(state)) { ready(); }
		});
		if (/complete/.test(loadedAlready)) { ready(); }
	});
}

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
	{ name: "MethodSelect", args: methodSelect, host: "Menu" },
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
	{ name: "KeySearch", args: keySearch },
	{ name: "SampleHistory", args: sampleHistory },
	{ name: "TrainingTray", args: trainingTray, services: trainingTrayServices, after: assessTrainingTray },
	// The WebView screens wait for their page to load; the rest still use loadMs
	// to give map tiles and the video's first frame time to render before the host
	// grabs the frame (framebuffer is the default capture — see captureScreens.js).
	{ name: "About", args: about, after: htmlLoaded },
	{ name: "Help", args: help, after: htmlLoaded },
	{ name: "VideoPlayer", args: videoPlayer, loadMs: 2000 },

	// Modals — captured over the screen a user reaches them from.
	{ name: "Academy", args: academy, services: academyServices, host: "Menu" },
	{ name: "AcademyDigitPicker", screen: "Academy", args: academy, services: academyServices, host: "Menu", after: openDigitPicker },
	{ name: "TrainingSuccess", args: trainingSuccess, host: "TrainingTray" },
	{ name: "SampleEditMenu", args: sampleEditMenu, host: "SampleHistory" },
	{ name: "SyncFeedback", args: syncFeedback, host: "SampleHistory" },

	// Components — no window of their own, hosted in one to be captured.
	{ name: "Question", args: question, wrap: true },
	{ name: "PhotoSelect", args: photoSelect, wrap: true },
	{ name: "EditTaxon", args: editTaxon, wrap: true },
	{ name: "LocationEntry", args: locationEntry, wrap: true, loadMs: 2000 },
	{ name: "LeafletMap", args: leafletMap, wrap: true, loadMs: 2000 },
	// iOS only: the inline date picker crashes Titanium's Android
	// TextInputLayout, so Android never instantiates this modal.
	{ name: "IosSurveyDatePicker", args: iosSurveyDatePicker, wrap: true, platform: "ios" },
];

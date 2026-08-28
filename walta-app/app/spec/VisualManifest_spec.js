require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { resetDatabase } = require("spec/util/TestUtils");
var manifest = require("spec/visual/manifest");
var { openEntry, runsHere, CAPTURE_LANDSCAPE } = require("spec/visual/openEntry");

// The visual suite is only as good as the screens it actually renders. A fixture
// that builds a bare Alloy shell captures an empty window and the diff still
// passes, so the manifest's own contract is worth pinning here: every entry opens
// a real screen, and the screens that exist to show data are seeded with some.
describe("visual capture manifest", function () {
	var view, opened;

	beforeEach(function () {
		resetDatabase();
	});

	afterEach(async function () {
		var toClose = opened;
		opened = null;
		view = null;
		if (toClose) { await toClose.dispose(); }
	});

	function entryNamed(name) {
		return manifest.filter(function (e) { return e.name === name; })[0];
	}

	async function open(entry) {
		opened = await openEntry(entry, manifest);
		view = opened.seam;
		return opened;
	}

	// A screen whose fixture throws is logged and skipped by the capture runner, so
	// the suite quietly captures a subset and still reports success — the failure
	// only shows up as a screen missing from the diff. One test per entry so a
	// broken fixture names itself.
	manifest.forEach(function (entry) {
		it("opens the " + entry.name + " screen", async function () {
			if (!runsHere(entry)) { this.skip(); }
			var opened = await open(entry);
			expect(opened.view, entry.name + " rendered no view").to.exist;
		});
	});

	// iOS re-resolves a window's orientation while the device is flat, as a
	// simulator always is, so screens otherwise settle in either landscape — which
	// turns the captured frame the other way up and mirrors the safe-area insets,
	// so the notch changes sides between runs and no baseline holds. The runner
	// pins each window it captures; the app declares both landscapes and knows
	// nothing about capture.
	if (OS_IOS) {
		it("pins every captured window to the one landscape it captures in", async function () {
			var opened = await open(entryNamed("Menu"));
			expect(opened.view.orientationModes).to.deep.equal([CAPTURE_LANDSCAPE]);
		});

		it("pins a component's host window too", async function () {
			var opened = await open(entryNamed("PhotoSelect"));
			expect(opened.view.orientationModes).to.deep.equal([CAPTURE_LANDSCAPE]);
		});
	}

	// A modal is overlaid on the window it is opened from, not pushed as one — so
	// capturing it means standing up its host screen first, exactly as the app does.
	it("overlays a modal entry on its host screen", async function () {
		await open(entryNamed("MethodSelect"));
		
		expect(view.getCurrentModal(), "MethodSelect opened no modal").to.exist;
		expect(view.getCurrentController(), "MethodSelect opened no host window").to.exist;
	});

	// Components have no window of their own — they render inside a screen. Hosting
	// one in a full-size window is how their device specs render them, and it is the
	// only way to get a capture of a piece of UI the app never opens on its own.
	it("hosts a component entry in a window of its own", async function () {
		var opened = await open(entryNamed("PhotoSelect"));
		expect(opened.view.children.length, "PhotoSelect rendered nothing").to.be.greaterThan(0);
	});

	// The runner opens every screen against one long-lived app, and three entries
	// run the sample-history fixture (the screen plus the two modals hosted on it).
	// A fixture that only appends would grow the table each time and drift the
	// capture — so seeding has to leave the same rows however often it runs.
	// The tray's whole point in training is the feedback, so the capture is worth
	// nothing without it — an entry can put its screen into the state worth
	// showing before the frame is grabbed.
	it("reveals the training tray's tick and cross verdicts", async function () {
		await open(entryNamed("TrainingTray"));
		var cells = view.getCurrentController().tray.children[0].children[1].children;
		var verdicts = cells.map(function (cell) { return cell.children[2]; });
		expect(verdicts.filter(function (v) { return v.visible; }), "no verdict overlay is showing")
			.to.have.length.greaterThan(0);
	});

	// The assessment notice fades in, dwells on a timer and fades out again, so
	// whether it lands in a capture is a race. The fixture holds it up for longer
	// than any capture takes, so it is reliably in frame rather than sometimes.
	it("captures the training tray with its assessment notice showing", async function () {
		await open(entryNamed("TrainingTray"));
		expect(view.getCurrentController().incorrectNotice.visible,
			"the assessment notice is not showing").to.equal(true);
	});

	it("seeds the sample history with the same rows however often its fixture runs", async function () {
		var entry = entryNamed("SampleHistory");
		entry.args();
		entry.args();
		await open(entry);
		expect(view.getCurrentController().sampleTable.data[0].rows.length).to.equal(3);
	});

	it("opens the sample tray with the taxa its fixture seeded", async function () {
		await open(entryNamed("SampleTray"));
		var vm = view.getScreenController().vm;
		var kinds = [];
		for (var i = 0; i < vm.cellCount; i++) { kinds.push(vm.cellKind(i)); }
		expect(kinds.filter(function (k) { return k === "taxon"; })).to.have.lengthOf(5);
	});
});

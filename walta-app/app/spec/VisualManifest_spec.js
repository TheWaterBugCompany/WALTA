require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, resetDatabase } = require("spec/util/TestUtils");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var manifest = require("spec/visual/manifest");

// The visual suite is only as good as the screens it actually renders. A fixture
// that builds a bare Alloy shell captures an empty window and the diff still
// passes, so the manifest's own contract is worth pinning here: every entry opens
// a real screen, and the screens that exist to show data are seeded with some.
describe("visual capture manifest", function () {
	var view;

	beforeEach(function () {
		resetDatabase();
	});

	afterEach(async function () {
		var ctl = view && view.getCurrentController();
		view = null;
		if (ctl) { await closeWindow(ctl.getView()); }
	});

	function entryNamed(name) {
		return manifest.filter(function (e) { return e.name === name; })[0];
	}

	async function open(entry) {
		view = makeTestServices().View;
		await view.openView(entry.screen || entry.name, entry.args());
		return view;
	}

	// A screen whose fixture throws is logged and skipped by the capture runner, so
	// the suite quietly captures a subset and still reports success — the failure
	// only shows up as a screen missing from the diff. One test per entry so a
	// broken fixture names itself.
	manifest.forEach(function (entry) {
		it("opens the " + entry.name + " screen", async function () {
			await open(entry);
			expect(view.getCurrentController(), entry.name + " built no controller").to.exist;
		});
	});

	it("opens the sample tray with the taxa its fixture seeded", async function () {
		await open(entryNamed("SampleTray"));
		var vm = view.getScreenController().vm;
		var kinds = [];
		for (var i = 0; i < vm.cellCount; i++) { kinds.push(vm.cellKind(i)); }
		expect(kinds.filter(function (k) { return k === "taxon"; })).to.have.lengthOf(5);
	});
});

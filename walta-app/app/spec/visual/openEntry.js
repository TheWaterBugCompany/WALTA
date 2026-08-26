// Opens one manifest entry the way the app opens that screen, and hands back the
// view to capture plus its teardown. Shared by the capture runner and
// VisualManifest_spec so the suite's contract test exercises the same opening
// path the captures go through.
//
// Three kinds of entry, because the app presents UI in three ways:
//
//   window     — the default. Goes through the View seam rather than
//                Alloy.createController: the seam builds the Titanium-free screen
//                controller that drives a view-model, and without it a
//                view-model-driven screen renders an empty window.
//   modal      — `host: "Menu"`. A modal is overlaid on whatever window it was
//                opened from, so the named host entry is opened first and the
//                capture shows the modal over the screen a user reaches it from.
//   component  — `wrap: true`. A piece of UI with no window of its own (the photo
//                panel, the map, a question card). Hosted in a full-size window,
//                the same way its device spec renders it.
//
// An entry owns its whole world: args() seeds the models the screen binds to and
// returns its open arguments, and services() contributes the collaborators the
// screen controller builds its view-model from (Academy needs Training, and so
// on) — so nothing about a screen leaks into the runner.
var { wrapViewInWindow, windowOpenTest, closeWindow } = require("spec/util/TestUtils");
var { makeTestServices } = require("spec/fixtures/Services_fixture");

// A screen only one platform ever instantiates (the iOS inline date picker
// crashes Titanium's Android TextInputLayout, so Android uses the native dialog).
function runsHere(entry) {
	if (!entry.platform) { return true; }
	return entry.platform === (OS_IOS ? "ios" : "android");
}

function entryNamed(entries, name) {
	var entry = entries.filter(function (e) { return e.name === name; })[0];
	if (!entry) { throw new Error("no manifest entry named " + name + " to host a modal on"); }
	return entry;
}

function screenOf(entry) {
	return entry.screen || entry.name;
}

async function openComponent(entry) {
	var ctl = Alloy.createController(screenOf(entry), entry.args());
	var win = wrapViewInWindow(ctl.getView());
	await windowOpenTest(win);
	return {
		view: win,
		dispose: async function () {
			await closeWindow(win);
			if (typeof ctl.cleanUp === "function") { ctl.cleanUp(); }
		},
	};
}

async function openWindow(seam, entry) {
	await seam.openView(screenOf(entry), entry.args());
	var ctl = seam.getCurrentController();
	return {
		view: ctl.getView(),
		dispose: async function () {
			await closeWindow(ctl.getView());
			if (typeof ctl.cleanUp === "function") { ctl.cleanUp(); }
		},
	};
}

// A modal's world is its host's plus its own — capturing SyncFeedback over
// SampleHistory needs SampleHistory's collaborators too.
function servicesFor(entry, hostEntry) {
	var overrides = {};
	if (hostEntry !== entry && hostEntry.services) { Object.assign(overrides, hostEntry.services()); }
	if (entry.services) { Object.assign(overrides, entry.services()); }
	return makeTestServices(overrides);
}

// A screen whose interesting state is reached by doing something (the training
// tray's verdicts only appear once it is assessed) declares it as after(), which
// runs before the frame is settled and grabbed.
async function withEntryState(entry, opened) {
	if (entry.after) { await entry.after(opened); }
	return opened;
}

async function openEntry(entry, entries) {
	// A component has no seam: it is built directly and hosted in a window.
	if (entry.wrap) { return withEntryState(entry, await openComponent(entry)); }

	var hostEntry = entry.host ? entryNamed(entries, entry.host) : entry;
	var seam = servicesFor(entry, hostEntry).View;
	var host = await openWindow(seam, hostEntry);
	if (!entry.host) { return withEntryState(entry, Object.assign(host, { seam: seam })); }

	seam.openModal(screenOf(entry), entry.args(), seam.services);
	return withEntryState(entry, {
		// The host window is what gets captured — the modal is a child of it.
		view: host.view,
		seam: seam,
		dispose: async function () {
			seam.closeModal();
			await host.dispose();
		},
	});
}

exports.openEntry = openEntry;
exports.runsHere = runsHere;

// The runner's half of the visual-capture file handshake, kept free of Titanium
// so the whole protocol — this half and the host's collectHandshake — can be run
// against each other in a Node test. The host cannot fall behind the runner only
// because the runner holds each screen until it is acked; that invariant is the
// thing worth testing, and it lives in the gap between the two halves.
//
// Everything here goes through a port — { exists, write, sleep } over the app's
// visual dir — so the device passes Ti.Filesystem and the test passes a temp dir.

const POLL_MS = 100;

const DONE = "capture-done";
const COLLECTOR_READY = "collector-ready";
const SCREEN = "screen.json";

function readyMarker(name) { return `${name}.ready`; }
function shotMarker(name) { return `${name}.shot`; }

// The host rewrites its marker on every poll, so this also survives the runner
// wiping the dir at the start of a run.
async function awaitCollector(port, pollMs) {
	while (!port.exists(COLLECTOR_READY)) { await port.sleep(pollMs); }
}

// Announce the screen is up and hold it until the host acks with <name>.shot.
//
// Two things keep a capture honest about which screen it holds. The runner opens
// nothing until the host is listening: a host slow to start — its view of the app
// container took ~199s to become readable on a contended CI runner — would
// otherwise find a backlog of markers naming screens that had already gone. And
// there is deliberately no deadline on the wait, because the host's capture
// timeout is the one clock in this protocol. A second clock on this end is what
// broke it: once the runner gave up, nothing on the host could tell that the
// marker it was about to shoot no longer named the screen on the device, so a
// wrong capture was blessed in silence. A host that never acks now runs its own
// deadline out and fails the run loudly instead.
async function holdUntilShot(port, name, { pollMs = POLL_MS } = {}) {
	await awaitCollector(port, pollMs);
	port.write(readyMarker(name));
	while (!port.exists(shotMarker(name))) { await port.sleep(pollMs); }
}

// The sentinel the host polls for: capture is complete. Written last so it can't
// appear before the final screen's .shot handshake.
function signalDone(port) {
	port.write(DONE);
}

// Report what screenMetrics made of this device's display, so the run records the
// screen it rendered on. Nothing on the host can work this out for itself: the
// bands are drawn against the landscape short edge in dp, and displayCaps reports
// points on iOS but pixels on Android, so only the device can say which band it is
// in.
function recordScreen(port, screen) {
	port.write(SCREEN, JSON.stringify(screen));
}

module.exports = { holdUntilShot, signalDone, recordScreen, readyMarker, shotMarker, DONE, COLLECTOR_READY, SCREEN, POLL_MS };

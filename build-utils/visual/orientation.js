// The app is landscape-locked, but a simulator/emulator screenshots the device's
// physical framebuffer — portrait. The host therefore has to rotate the frame
// upright, and which way depends on which of the two landscape orientations the
// device settled in. A fixed rotation can't know, which is how captures came out
// 180° round; the capture runner reports the orientation instead.
//
// It travels in the handshake marker's *name* (`Menu.ready-landscape-left`) so
// the host learns it from the directory listing it already does, with no extra
// round trip into the app's private data dir.

const READY = ".ready";
const RIGHT = "landscape-right";

export function readyMarker(name, orientation) {
    return orientation ? `${name}${READY}-${orientation}` : `${name}${READY}`;
}

export function parseReadyMarker(file) {
    const match = new RegExp(`^(.+)\\${READY}(?:-([a-z-]+))?$`).exec(file);
    return match ? { name: match[1], orientation: match[2] } : null;
}

// Degrees clockwise to bring the captured frame upright. A device that already
// delivered a landscape frame needs none.
//
// The app settles in LANDSCAPE_LEFT, which needs 270 — the fixed 90 this
// replaces was only ever right for the other landscape, which is why captures
// came out upside down. So an unreported orientation assumes the common one
// rather than preserving that mistake.
export function rotationFor(orientation, { width, height }) {
    if (width >= height) { return 0; }
    return orientation === RIGHT ? 90 : 270;
}

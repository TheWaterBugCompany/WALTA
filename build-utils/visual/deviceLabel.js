// The directory a capture run lands in, derived from the device that rendered
// it. Baselines are renderer-specific, so the device — not the person running
// the command — decides which baseline set a run belongs to. The OS version is
// dropped: a point release doesn't warrant a fresh baseline set, and keeping it
// would strand the old one on every simulator update.
export function deviceLabel(description) {
    return String(description).split("·")[0]
        .trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

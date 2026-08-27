// Renders walta-app/tiapp.xml from tiapp.xml.template at build time. The template
// is committed; the generated file is not, because it carries the maps key.

const MAPS_KEY_PLACEHOLDER = "GOOGLE_MAPS_API_KEY_PLACEHOLDER";

// The landscape the visual suite captures in, matching CAPTURE_LANDSCAPE in
// walta-app/app/spec/visual/openEntry.js.
export const CAPTURE_ORIENTATION = "UIInterfaceOrientationLandscapeRight";

// Any declared orientation that isn't the one the capture build keeps.
const OTHER_ORIENTATION_LINE = new RegExp(
    `[ \\t]*<string>(?!${CAPTURE_ORIENTATION}<)UIInterfaceOrientation\\w+</string>\\n?`,
    "g",
);

// A capture build declares one landscape and no more.
//
// iOS re-resolves which landscape a window opens in whenever the device
// orientation is ambiguous, and a simulator's always is — it reports no
// orientation at all. Screens then settle in either landscape, which turns the
// captured frame the other way up and mirrors the safe-area insets, so the notch
// changes sides between runs and no baseline holds.
//
// This is deliberately a property of the *build*, not of the app: the shipped
// plist keeps both landscapes so a phone can be held either way, and no app code
// knows anything about capture. Pinning it in the app instead is what left the
// running app locked to whichever landscape it launched in.
//
// Done by deleting the other orientations rather than rewriting the array, so
// nothing else about the generated file can shift.
function narrowToCaptureLandscape(xml) {
    return xml.replace(
        /(<key>UISupportedInterfaceOrientations~\w+<\/key>\s*<array>)([\s\S]*?)(<\/array>)/g,
        (_, open, body, close) => open + body.replace(OTHER_ORIENTATION_LINE, "") + close,
    );
}

export function renderTiapp(template, { mapsApiKey, singleLandscape = false } = {}) {
    const xml = template.split(MAPS_KEY_PLACEHOLDER).join(mapsApiKey || "");
    return singleLandscape ? narrowToCaptureLandscape(xml) : xml;
}

import { expect } from "chai";
import { buildReportModel } from "../../build-utils/visual/reportModel.js";
import { renderReport } from "../../build-utils/visual/renderReport.js";

function imageSources(html) {
    return [...html.matchAll(/data-src-\w+="([^"]+)"|<img[^>]+src="([^"]+)"/g)].map((m) => m[1] || m[2]);
}

function rule(html, selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`\\n${escaped}\\s*\\{([^}]*)\\}`).exec(html);
    return match ? match[1] : "";
}

function matteColour(html) {
    return (/--matte:\s*(#[0-9a-f]{6})/i.exec(html) || [])[1];
}

const RUNS = [
    { platform: "android", device: "small", results: [{ name: "Menu", status: "fail", diffPixels: 42 }] },
    { platform: "ios", device: "iphone-17", results: [{ name: "Menu", status: "pass" }, { name: "About", status: "new" }] },
];

describe("visual report page", function () {
    let html;
    before(function () { html = renderReport(buildReportModel(RUNS), { title: "Visual review" }); });

    it("names every screen it captured", function () {
        expect(html).to.contain("Menu").and.to.contain("About");
    });

    it("labels a column for each platform and device captured", function () {
        expect(html).to.contain("android").and.to.contain("small")
            .and.to.contain("ios").and.to.contain("iphone-17");
    });

    it("references the baseline, capture and diff image of a differing screen", function () {
        const sources = imageSources(html);
        expect(sources).to.include("android/small/baseline/Menu.png");
        expect(sources).to.include("android/small/actual/Menu.png");
        expect(sources).to.include("android/small/report/Menu.diff.png");
    });

    it("reports how far a screen drifted from its baseline", function () {
        expect(html).to.contain("42");
    });

    // A downloaded artifact can be missing a leg's PNGs; the browser's broken-image
    // glyph reads as a rendering fault rather than an absent file.
    it("says so when an image is not there, rather than showing a broken image", function () {
        expect(html).to.contain("onerror").and.to.contain("is-broken");
    });

    // A capture carries the device's own black bars in its pixels. Sat flush against
    // the page they read as part of the photo — which is how a correctly fitted photo
    // gets reported as one with a black border round it.
    it("mats a capture in the grid on grey, so its own black bars end somewhere visible", function () {
        expect(rule(html, ".shot")).to.contain("var(--matte)");
        expect(matteColour(html)).to.match(/^#(\w\w)\1\1$/);
    });

    it("mats a zoomed capture on the same grey, rather than on black", function () {
        expect(rule(html, ".pane img")).to.contain("var(--matte)").and.to.not.contain("#000");
    });

    // The rest of the palette flips with the reader's scheme; this one must not, or
    // the matte becomes the very black it exists to separate the capture from.
    it("keeps the matte grey in dark mode", function () {
        const [, dark] = html.split("prefers-color-scheme");
        expect(dark).to.not.contain("--matte:");
    });

    it("loads nothing off the network so it opens from a downloaded artifact", function () {
        expect(html).to.not.match(/(src|href)="https?:/);
    });
});

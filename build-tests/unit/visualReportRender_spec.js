import { expect } from "chai";
import { buildReportModel } from "../../build-utils/visual/reportModel.js";
import { renderReport } from "../../build-utils/visual/renderReport.js";

function imageSources(html) {
    return [...html.matchAll(/data-src-\w+="([^"]+)"|<img[^>]+src="([^"]+)"/g)].map((m) => m[1] || m[2]);
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

    it("loads nothing off the network so it opens from a downloaded artifact", function () {
        expect(html).to.not.match(/(src|href)="https?:/);
    });
});

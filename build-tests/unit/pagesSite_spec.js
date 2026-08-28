import { expect } from "chai";
import { retainedRuns, renderIndex } from "../../build-utils/visual/pagesSite.js";

// Runs newest-first as the site lists them.
const RUN = (id, over = {}) => ({ id, branch: "main", sha: "abc1234", capturedAt: "2026-08-28T01:00:00Z", ...over });

describe("retainedRuns", function () {
    it("puts the incoming run first, so the newest report is the one at the top", function () {
        const kept = retainedRuns([RUN("100"), RUN("99")], RUN("101"), 10);
        expect(kept.map((r) => r.id)).to.deep.equal(["101", "100", "99"]);
    });

    it("drops the oldest runs once the limit is reached, to stay under the Pages size cap", function () {
        const existing = [RUN("103"), RUN("102"), RUN("101"), RUN("100")];
        expect(retainedRuns(existing, RUN("104"), 3).map((r) => r.id)).to.deep.equal(["104", "103", "102"]);
    });

    it("replaces a run that is published twice rather than listing it twice", function () {
        const kept = retainedRuns([RUN("101", { sha: "old" }), RUN("100")], RUN("101", { sha: "new" }), 10);
        expect(kept.map((r) => r.id)).to.deep.equal(["101", "100"]);
        expect(kept[0].sha).to.equal("new");
    });

    it("publishes the first run onto an empty site", function () {
        expect(retainedRuns([], RUN("1"), 10).map((r) => r.id)).to.deep.equal(["1"]);
    });
});

describe("renderIndex", function () {
    it("links each run to its own report", function () {
        const html = renderIndex([RUN("101", { branch: "task/wb-1-x" })]);
        expect(html).to.contain('href="101/report.html"');
        expect(html).to.contain("task/wb-1-x");
    });

    it("says so plainly when no run has been published yet", function () {
        expect(renderIndex([])).to.contain("No visual runs published yet");
    });

    // The site is public and the branch name comes from whoever pushed it.
    it("escapes a branch name that would otherwise inject markup", function () {
        const html = renderIndex([RUN("1", { branch: '<img src=x onerror=alert(1)>' })]);
        expect(html).to.not.contain("<img src=x");
        expect(html).to.contain("&lt;img src=x");
    });
});

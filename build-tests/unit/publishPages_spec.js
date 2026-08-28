import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { publish } from "../../build-utils/visual/publishPages.js";

const RUN = (id) => ({ id, branch: "main", sha: "abc1234", capturedAt: "2026-08-28T01:00:00Z" });

describe("publishPages", function () {
    let root, siteDir, captureDir;

    beforeEach(function () {
        root = fs.mkdtempSync(path.join(os.tmpdir(), "pages-"));
        siteDir = path.join(root, "site");
        captureDir = path.join(root, "captures");
        fs.mkdirSync(path.join(captureDir, "ios", "iphone-17"), { recursive: true });
        fs.writeFileSync(path.join(captureDir, "report.html"), "<h1>gallery</h1>");
        fs.writeFileSync(path.join(captureDir, "ios", "iphone-17", "Menu.png"), "png");
    });

    afterEach(function () {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it("puts the whole capture tree under the run's own id, images and all", function () {
        publish({ siteDir, captureDir, run: RUN("101") });
        expect(fs.existsSync(path.join(siteDir, "101", "report.html"))).to.equal(true);
        expect(fs.existsSync(path.join(siteDir, "101", "ios", "iphone-17", "Menu.png"))).to.equal(true);
    });

    it("writes an index linking the run", function () {
        publish({ siteDir, captureDir, run: RUN("101") });
        expect(fs.readFileSync(path.join(siteDir, "index.html"), "utf8")).to.contain('href="101/report.html"');
    });

    it("keeps earlier runs so an older report stays readable", function () {
        publish({ siteDir, captureDir, run: RUN("101") });
        publish({ siteDir, captureDir, run: RUN("102") });
        expect(fs.existsSync(path.join(siteDir, "101", "report.html"))).to.equal(true);
        expect(fs.existsSync(path.join(siteDir, "102", "report.html"))).to.equal(true);
    });

    it("deletes the oldest run's files once past the limit, not just its index row", function () {
        publish({ siteDir, captureDir, run: RUN("101"), limit: 2 });
        publish({ siteDir, captureDir, run: RUN("102"), limit: 2 });
        publish({ siteDir, captureDir, run: RUN("103"), limit: 2 });
        expect(fs.existsSync(path.join(siteDir, "101")), "101 should have been pruned").to.equal(false);
        expect(fs.existsSync(path.join(siteDir, "103"))).to.equal(true);
    });

    // The site is a git checkout — the caller commits and pushes it straight
    // after. Pruning by "directory that is not a kept run" swallowed .git, and
    // the publish died on the next git command with "not in a git directory".
    it("leaves the git checkout it was handed alone", function () {
        fs.mkdirSync(path.join(siteDir, ".git", "refs"), { recursive: true });
        fs.writeFileSync(path.join(siteDir, ".git", "HEAD"), "ref: refs/heads/gh-pages");
        publish({ siteDir, captureDir, run: RUN("101"), limit: 1 });
        publish({ siteDir, captureDir, run: RUN("102"), limit: 1 });
        expect(fs.existsSync(path.join(siteDir, ".git", "HEAD")), ".git was pruned").to.equal(true);
    });

    // Pages serves through Jekyll unless told not to, which silently drops any
    // directory whose name starts with an underscore.
    it("disables Jekyll so no capture directory is swallowed", function () {
        publish({ siteDir, captureDir, run: RUN("101") });
        expect(fs.existsSync(path.join(siteDir, ".nojekyll"))).to.equal(true);
    });

    it("rebuilds from the directories when the manifest is missing or corrupt", function () {
        publish({ siteDir, captureDir, run: RUN("101") });
        fs.writeFileSync(path.join(siteDir, "runs.json"), "not json");
        const kept = publish({ siteDir, captureDir, run: RUN("102") });
        expect(kept.map((r) => r.id)).to.deep.equal(["102"]);
        expect(fs.existsSync(path.join(siteDir, "101")), "a run the manifest lost is pruned, not orphaned").to.equal(false);
    });
});

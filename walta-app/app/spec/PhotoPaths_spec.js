require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { makeTestPhoto, clearDatabase } = require("spec/util/TestUtils");
var PhotoUtils = require("util/PhotoUtils");

// Regression guard for WB-88: photos stored an absolute path embedding the iOS
// data-container UUID, which changes across app updates — so the stored path
// went stale and the image rendered blank even though the file survived under
// the new container. Exercised against the real taxa model + Ti.Filesystem.
describe("Photo path healing (WB-88)", function () {
    beforeEach(function () {
        clearDatabase();
    });

    function makeTaxonWithPhoto() {
        var taxon = Alloy.createModel("taxa");
        taxon.set("sampleId", 666);
        taxon.set("taxonId", 1);
        taxon.setPhoto(makeTestPhoto("wb88_source.jpg"));
        return taxon;
    }

    it("stores a creature photo as a relative name, not an absolute container path", function () {
        var stored = makeTaxonWithPhoto().getPhoto();
        expect(stored).to.match(/^taxon_666_1_\d+\.jpg$/);
        expect(stored).to.not.contain("file://");
    });

    it("resolves a creature photo whose stored path has a stale container UUID", function () {
        var name = makeTaxonWithPhoto().getPhoto();
        // Simulate a legacy row written under a now-dead container.
        var stalePath = `file:///var/mobile/Containers/Data/Application/`
            + `DEADBEEF-0000-0000-0000-000000000000/Documents/${name}`;

        var resolved = PhotoUtils.absolutePath(stalePath);

        expect(resolved.exists(), "healed file should exist under current container").to.be.true;
        expect(resolved.read(), "healed file should be readable").to.be.ok;
    });
});

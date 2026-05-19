require("mocha");
const { expect } = require("chai");
const path = require("path");
const { assertLooksSame } = require("../features/support/image-test");

const TAXON11 = path.join(__dirname, "../test-resources/expected_taxon11_photo.png");
const TAXON12 = path.join(__dirname, "../test-resources/expected_taxon12_photo.png");

describe("image-test.assertLooksSame", function () {
    // Tight timeout: looks-same@10.0.1 hangs on macOS arm64 (never invokes
    // its callback). A 5s ceiling turns the hang into a deterministic
    // failure instead of letting it stall the whole suite.
    this.timeout(5000);

    it("resolves when comparing an image to itself", async function () {
        await assertLooksSame(TAXON11, TAXON11);
    });

    it("throws when comparing two visually distinct images", async function () {
        let threw = false;
        try {
            await assertLooksSame(TAXON11, TAXON12);
        } catch (_) {
            threw = true;
        }
        expect(threw, "expected assertLooksSame to throw for distinct images").to.be.true;
    });
});

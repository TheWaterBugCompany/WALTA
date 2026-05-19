require("mocha");
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const { Jimp } = require("jimp");
const { assertLooksSame } = require("../features/support/image-test");

const TAXON11 = path.join(__dirname, "../test-resources/expected_taxon11_photo.png");
const TAXON12 = path.join(__dirname, "../test-resources/expected_taxon12_photo.png");
const TAXON11_RESIZED = "/tmp/taxon11_resized_for_spec.png";

describe("image-test.assertLooksSame", function () {
    this.timeout(5000);

    before(async function () {
        // Create a smaller copy of TAXON11 (same content, different
        // resolution) to prove the normalised compare survives size
        // changes — that's the whole point of switching to jimp + a
        // fixed-dimension pixelmatch. scale() preserves aspect ratio
        // so the test exercises resolution variance only, not aspect.
        const img = await Jimp.read(TAXON11);
        img.scale(0.5);
        await img.write(TAXON11_RESIZED);
    });

    after(function () {
        try { fs.unlinkSync(TAXON11_RESIZED); } catch (_) { /* best-effort */ }
    });

    it("resolves when comparing an image to itself", async function () {
        await assertLooksSame(TAXON11, TAXON11);
    });

    it("resolves when comparing the same image at different resolutions", async function () {
        await assertLooksSame(TAXON11, TAXON11_RESIZED);
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

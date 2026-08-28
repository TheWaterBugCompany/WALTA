require("mocha");
const { expect } = require("chai");
const Taxon = require("../../walta-app/app/lib/logic/Taxon");

// Italics on a taxon name are nomenclature, not decoration: genus and species are
// italicised, family and above are not. The rule already lived inside
// getScientificNameHtml; it is here so a screen that wants to emphasise a name in
// running text asks for it rather than copying the genus/species test.
//
// The shapes below are taken from walta-taxonomy/walta/key.json, because the
// interesting cases are the ones the real key actually contains.
describe("Taxon name emphasis", function () {
    function taxon(name, scientificName) {
        return Taxon.createTaxon({ name: name, scientificName: scientificName });
    }

    describe("by rank", function () {
        it("italicises a species", function () {
            expect(Taxon.isItalicisedRank("species")).to.be.true;
        });

        it("italicises a genus", function () {
            expect(Taxon.isItalicisedRank("genus")).to.be.true;
        });

        // 54 of the key's 154 displayed names are families — the largest group,
        // and every one of them would be wrong in italics.
        it("leaves a family roman", function () {
            expect(Taxon.isItalicisedRank("family")).to.be.false;
        });

        ["order", "class", "phylum", "alt"].forEach(function (rank) {
            it(`leaves ${rank} roman`, function () {
                expect(Taxon.isItalicisedRank(rank)).to.be.false;
            });
        });
    });

    describe("for the name a taxon displays", function () {
        it("italicises a species it is named for", function () {
            const t = taxon("Potamopyrgus antipodarum", [
                { taxonomicLevel: "class", name: "Gastropoda" },
                { taxonomicLevel: "family", name: "Hydrobiidae" },
                { taxonomicLevel: "species", name: "Potamopyrgus antipodarum" },
            ]);
            expect(t.isNameItalicised()).to.be.true;
        });

        it("leaves a family name roman", function () {
            const t = taxon("Planorbidae", [
                { taxonomicLevel: "class", name: "Gastropoda" },
                { taxonomicLevel: "family", name: "Planorbidae" },
                { taxonomicLevel: "alt", name: "Planorbidae" },
            ]);
            expect(t.isNameItalicised()).to.be.false;
        });

        // 'gastropods' is not any of its own scientific names — the displayed name
        // is matched against them rather than assumed to be one.
        it("leaves a name that is not a scientific name at all roman", function () {
            const t = taxon("gastropods", [{ taxonomicLevel: "class", name: "Gastropoda" }]);
            expect(t.isNameItalicised()).to.be.false;
        });

        it("leaves a taxon with no scientific name roman", function () {
            expect(taxon("Decapods", []).isNameItalicised()).to.be.false;
        });
    });

    // The rule's original home, which must keep saying exactly what it said.
    describe("the classification block still reads the same rule", function () {
        it("italicises only the genus and species rows", function () {
            const html = taxon("Physa acuta", [
                { taxonomicLevel: "class", name: "Gastropoda" },
                { taxonomicLevel: "family", name: "Physidae" },
                { taxonomicLevel: "species", name: "Physa acuta" },
            ]).getScientificNameHtml();
            expect(html).to.contain("<i>Physa acuta</i>");
            expect(html).to.not.contain("<i>Physidae</i>");
            expect(html).to.not.contain("<i>Gastropoda</i>");
        });
    });
});

require("mocha");
const { expect } = require("chai");
const TaxonComparisonViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/TaxonComparison");
const Topics = require("../../walta-app/app/lib/ui/Topics");

// A key stand-in: only findTaxonById is needed to turn an id into what the
// screen shows, so the spec runs against a real view-model and a fake key.
const KEY = {
    findTaxonById(id) {
        return {
            "WB1": { id: "WB1", name: "Sleeping bag caddis", photoUrls: ["/photos/caddis.jpg"] },
            "WB2": { id: "WB2", name: "Anisops", photoUrls: ["/photos/anisops.jpg", "/photos/anisops-2.jpg"] },
            "WB3": { id: "WB3", name: "Nameless", photoUrls: [] },
        }[id];
    },
};

describe("TaxonComparisonViewModel", function () {
    afterEach(function () { Topics.reset(); });

    function build(args) {
        return new TaxonComparisonViewModel(Object.assign({ topics: Topics, key: KEY }, args));
    }

    function correct() { return build({ selectedTaxonId: "WB1", correctTaxonId: "WB1" }); }
    function incorrect() { return build({ selectedTaxonId: "WB2", correctTaxonId: "WB1" }); }

    describe("a correct identification", function () {
        it("says so, naming the taxon", function () {
            expect(correct().message).to.equal("You correctly identified this taxon: Sleeping bag caddis.");
        });

        it("shows the one taxon, with nothing to compare it against", function () {
            expect(correct().taxa).to.deep.equal([
                { taxonId: "WB1", name: "Sleeping bag caddis", photoUrl: "/photos/caddis.jpg" },
            ]);
        });

        it("offers no way to ask which question went wrong, because none did", function () {
            expect(correct().showsWhichQuestion).to.equal(false);
        });
    });

    describe("an incorrect identification", function () {
        it("names what was chosen and what it should have been", function () {
            expect(incorrect().message)
                .to.equal("You incorrectly identified this taxon as Anisops but it should have been Sleeping bag caddis.");
        });

        // The chosen one first, the correct one second — the reader's own answer
        // is what they look for, and the designs put it on the left.
        it("shows the chosen taxon beside the correct one", function () {
            expect(incorrect().taxa).to.deep.equal([
                { taxonId: "WB2", name: "Anisops", photoUrl: "/photos/anisops.jpg" },
                { taxonId: "WB1", name: "Sleeping bag caddis", photoUrl: "/photos/caddis.jpg" },
            ]);
        });

        it("offers to show which question went wrong", function () {
            expect(incorrect().showsWhichQuestion).to.equal(true);
        });

        // Wiring the button to the key is WB-253's job; this screen only says it
        // was pressed, so whatever opened it decides where that goes.
        it("reports the request rather than acting on it", function () {
            const vm = incorrect();
            let asked = 0;
            vm.on("which-question", () => asked++);
            vm.whichQuestion();
            expect(asked).to.equal(1);
        });
    });

    it("closes when dismissed", function () {
        const vm = correct();
        let closed = 0;
        vm.on("close", () => closed++);
        vm.close();
        expect(closed).to.equal(1);
    });

    // Browsing out to a taxon from here must not offer to add it to the sample:
    // this screen is feedback on an assessment, not an identification step.
    it("browses to a taxon without offering to add it to the sample", function () {
        const jumps = [];
        Topics.subscribe(Topics.JUMPTO, (e) => jumps.push(e));
        incorrect().openTaxon("WB2");
        expect(jumps).to.deep.equal([{ id: "WB2", allowAddToSample: false }]);
    });

    it("shows no photo for a taxon that has none, rather than a broken one", function () {
        expect(build({ selectedTaxonId: "WB3", correctTaxonId: "WB3" }).taxa)
            .to.deep.equal([{ taxonId: "WB3", name: "Nameless", photoUrl: null }]);
    });
});

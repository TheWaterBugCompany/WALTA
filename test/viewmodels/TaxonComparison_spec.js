require("mocha");
const { expect } = require("chai");
const TaxonComparisonViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/TaxonComparison");
const Topics = require("../../walta-app/app/lib/ui/Topics");

// A key stand-in. A taxon's ref and its taxonId are different id spaces in the
// real key — "184" finds the taxon, "ancylidae" is what a hint is looked up by —
// so the fixture keeps them apart and answers nothing to the wrong one.
const TAXA = {
    "WB1": { id: "caddis-ref", name: "Sleeping bag caddis", photoUrls: ["/photos/caddis.jpg"] },
    "WB2": { id: "anisops-ref", name: "Anisops", photoUrls: ["/photos/anisops.jpg", "/photos/anisops-2.jpg"] },
    "WB3": { id: "nameless-ref", name: "Nameless", photoUrls: [] },
};
const REFS = Object.keys(TAXA).map((id) => TAXA[id].id);
const KEY = {
    findTaxonById(id) { return TAXA[id]; },
    hintForIncorrectDecision(selectedRef, expectedRef) {
        if (REFS.indexOf(selectedRef) < 0 || REFS.indexOf(expectedRef) < 0) { return null; }
        return { nodeId: "couplet-7", correctRef: expectedRef, incorrectRef: selectedRef };
    },
};

describe("TaxonComparisonViewModel", function () {
    afterEach(function () { Topics.reset(); });

    function build(args) {
        return new TaxonComparisonViewModel(Object.assign({ topics: Topics, key: KEY }, args));
    }

    function correct() { return build({ selectedTaxonId: "WB1", correctTaxonId: "WB1" }); }
    function cards(vm) {
        return vm.cards.map((c) => ({ name: c.name, photoUrl: c.photoUrl, hasPhoto: c.hasPhoto }));
    }
    function incorrect() { return build({ selectedTaxonId: "WB2", correctTaxonId: "WB1" }); }

    describe("a correct identification", function () {
        it("says so, naming the taxon", function () {
            expect(correct().message).to.equal("You correctly identified this taxon: Sleeping bag caddis.");
        });

        it("shows the one taxon, with nothing to compare it against", function () {
            expect(cards(correct())).to.deep.equal([
                { name: "Sleeping bag caddis", photoUrl: "/photos/caddis.jpg", hasPhoto: true },
            ]);
        });

        it("offers no way to ask which question went wrong, because none did", function () {
            expect(correct().showsWhichQuestion).to.equal(false);
        });

        it("marks itself with the same tick the tray uses", function () {
            expect(correct().verdictImage).to.equal("/images/tick-icon.png");
        });

        it("offers only a way out, since there is nothing to follow up", function () {
            expect(correct().actionLabel).to.equal("Close");
        });

        it("dismisses when the action is taken", function () {
            const vm = correct();
            let closed = 0;
            vm.on("close", () => closed++);
            vm.activate();
            expect(closed).to.equal(1);
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
            expect(cards(incorrect())).to.deep.equal([
                { name: "Anisops", photoUrl: "/photos/anisops.jpg", hasPhoto: true },
                { name: "Sleeping bag caddis", photoUrl: "/photos/caddis.jpg", hasPhoto: true },
            ]);
        });

        it("offers to show which question went wrong", function () {
            expect(incorrect().showsWhichQuestion).to.equal(true);
        });

        it("marks itself with the same cross the tray uses", function () {
            expect(incorrect().verdictImage).to.equal("/images/cross-icon.png");
        });

        // The follow-up replaces the plain dismissal rather than sitting beside it
        // — the ✕ in the titlebar is still there to just leave.
        it("replaces the plain close with the follow-up", function () {
            expect(incorrect().actionLabel).to.equal("Which question did I get wrong?");
        });

        it("opens the key at the couplet it went astray at, with the hint applied", function () {
            const jumps = [];
            Topics.subscribe(Topics.JUMPTO, (e) => jumps.push(e));
            incorrect().whichQuestion();
            expect(jumps).to.deep.equal([{
                id: "couplet-7",
                hint: { nodeId: "couplet-7", correctRef: "caddis-ref", incorrectRef: "anisops-ref" },
                allowAddToSample: true,
                position: null,
                training: true,
            }]);
        });

        // A modal that navigates dismisses itself first, or the key opens behind it.
        it("dismisses itself on the way to the key", function () {
            const vm = incorrect();
            let closed = 0;
            vm.on("close", () => closed++);
            vm.whichQuestion();
            expect(closed).to.equal(1);
        });

        // The corrected identification has to land back in the slot it was graded
        // in, not appended to the end of the tray.
        it("carries the tray position it was opened for", function () {
            const jumps = [];
            Topics.subscribe(Topics.JUMPTO, (e) => jumps.push(e));
            build({ selectedTaxonId: "WB2", correctTaxonId: "WB1", position: 3 }).whichQuestion();
            expect(jumps[0].position).to.equal(3);
        });

        it("asks which question when the action is taken", function () {
            const jumps = [];
            Topics.subscribe(Topics.JUMPTO, (e) => jumps.push(e));
            incorrect().activate();
            expect(jumps).to.have.length(1);
        });

    });

    it("closes when dismissed", function () {
        const vm = correct();
        let closed = 0;
        vm.on("close", () => closed++);
        vm.close();
        expect(closed).to.equal(1);
    });

    // Tapping a card browses to that taxon — feedback on an assessment, not a
    // step in an identification, so it must not offer to add it to the sample.
    it("browses to the tapped taxon without offering to add it to the sample", function () {
        const jumps = [];
        Topics.subscribe(Topics.JUMPTO, (e) => jumps.push(e));
        incorrect().cards[0].open();
        expect(jumps[0].allowAddToSample).to.be.false;
    });

    // The key browses by ref, not by taxonId — the two are separate id spaces, and
    // handed the wrong one the key finds neither a node nor a taxon and throws.
    it("browses out by the taxon's ref, not its taxonId", function () {
        const jumps = [];
        Topics.subscribe(Topics.JUMPTO, (e) => jumps.push(e));
        incorrect().cards[0].open();
        expect(jumps[0].id).to.equal("anisops-ref");
    });

    it("shows no photo for a taxon that has none, rather than a broken one", function () {
        expect(cards(build({ selectedTaxonId: "WB3", correctTaxonId: "WB3" })))
            .to.deep.equal([{ name: "Nameless", photoUrl: null, hasPhoto: false }]);
    });

    // bindView re-reads a collection getter on every change; rebuilding the cards
    // each time would tear down and remount the photos for nothing.
    it("keeps the same card objects across reads", function () {
        const vm = incorrect();
        expect(vm.cards[0]).to.equal(vm.cards[0]);
    });

    // bindView's collection diff keys children by item.key. Without one, both
    // cards key as undefined, the diff reads them as the same child, and only
    // one photo is ever mounted — which is exactly what the screen did.
    it("gives each card a key of its own so both are mounted", function () {
        const keys = incorrect().cards.map((c) => c.key);
        expect(keys).to.deep.equal(["WB2", "WB1"]);
    });
});

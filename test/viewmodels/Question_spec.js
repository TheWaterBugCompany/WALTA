require("mocha");
const { expect } = require("chai");

const Question = require("logic/Question");
const Palette = require("../../walta-app/app/lib/util/Palette");
const QuestionViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/Question");

function build({ verdict = null, text = "  Animal without a shell  ", mediaUrls = [] } = {}) {
    return new QuestionViewModel({
        key: "0",
        question: Question.createQuestion({ text, mediaUrls }),
        verdict,
        onSelect: () => {},
    });
}

describe("QuestionViewModel", function () {
    it("trims the whitespace the key data carries around its text", function () {
        expect(build().text).to.equal("Animal without a shell");
    });

    it("knows whether the branch has a photo to show", function () {
        expect(build().hasPhoto).to.equal(false);
        expect(build({ mediaUrls: ["snail.jpg"] }).hasPhoto).to.equal(true);
    });

    it("shows the photo panel only when there is a photo for it", function () {
        expect(build({ mediaUrls: ["snail.jpg"] }).photoVisible).to.equal(true);
        expect(build().photoVisible).to.equal(false);
    });

    // The card is sized by the widths its children ask for, so the text has to
    // take on exactly what the photo panel gives up. Anything less and a branch
    // without a photo makes a narrower card than the one above it, and their
    // right edges and arrows stop lining up.
    it("hands the text the whole share the photo panel gives up", function () {
        const withPhoto = build({ mediaUrls: ["snail.jpg"] });
        const without = build();
        const pct = (w) => Number.parseFloat(w);

        expect(pct(without.textWidth) - pct(withPhoto.textWidth)).to.equal(pct(withPhoto.photoWidth));
    });

    it("shows a tick on the correct branch and a cross on the incorrect one", function () {
        expect(build({ verdict: "correct" }).verdictImage).to.equal("/images/tick-icon.png");
        expect(build({ verdict: "incorrect" }).verdictImage).to.equal("/images/cross-icon.png");
        expect(build().verdictVisible).to.equal(false);
    });

    it("gives the verdict a gutter beside the card only when one is shown", function () {
        expect(Number.parseFloat(build().cardLeft)).to.equal(0);
        expect(Number.parseFloat(build({ verdict: "correct" }).cardLeft)).to.be.greaterThan(0);
    });

    // The outline restates the verdict the tick/cross already gives, so it has to
    // be the same colour as the icon it sits around — see verdictColours_spec,
    // which pins each palette entry to its icon.
    it("outlines the branch in the colour of its verdict", function () {
        expect(build({ verdict: "correct" }).borderColor).to.equal(Palette.success);
        expect(build({ verdict: "incorrect" }).borderColor).to.equal(Palette.failure);
    });

    it("draws no outline on a branch with no verdict", function () {
        // Titanium paints a hairline for a colour set at zero width, so an
        // unhinted branch has to have no colour rather than a hidden one.
        expect(build().borderColor).to.equal("transparent");
        expect(build().borderWidth).to.equal(0);
    });

    // ti.ui.defaultunit is "system", which is points on iOS but raw pixels on
    // Android — a bare number drew the outline three times thinner there.
    it("measures the outline in units that mean the same on both platforms", function () {
        expect(build({ verdict: "correct" }).borderWidth).to.match(/^\d+dp$/);
        expect(build({ verdict: "incorrect" }).borderWidth).to.match(/^\d+dp$/);
    });
});

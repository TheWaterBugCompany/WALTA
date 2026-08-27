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

    it("gives the text the whole row when there is no photo beside it", function () {
        const withPhoto = build({ mediaUrls: ["snail.jpg"] });
        const without = build();
        expect(withPhoto.photoVisible).to.equal(true);
        expect(without.photoVisible).to.equal(false);
        expect(Number.parseFloat(without.textWidth)).to.be.greaterThan(Number.parseFloat(withPhoto.textWidth));
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

    it("outlines the branch in the colour of its verdict", function () {
        expect(build({ verdict: "correct" }).borderColor).to.equal(Palette.success);
        expect(build({ verdict: "incorrect" }).borderColor).to.equal(Palette.errorDark);
    });

    it("draws no outline on a branch with no verdict", function () {
        // Titanium paints a hairline for a colour set at zero width, so an
        // unhinted branch has to have no colour rather than a hidden one.
        expect(build().borderColor).to.equal("transparent");
        expect(build().borderWidth).to.equal(0);
        expect(build({ verdict: "correct" }).borderWidth).to.be.greaterThan(0);
    });
});

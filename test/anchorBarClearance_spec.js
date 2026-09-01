require("mocha");
const { expect } = require("chai");
const { bottomClearance } = require("../walta-app/app/lib/ui/AnchorBarInsets");

// Values as Titanium reports them: system units (px on Android), at the
// density of a Pixel in gesture navigation — 24dp navigation bar = 84px,
// while Android reserves 32dp = 112px for the home gesture.
const dpToPx = (dp) => dp * 3.5;

describe("AnchorBarInsets.bottomClearance", function () {

    it("clears the gesture strip even though the safe area reports less", function () {
        expect(bottomClearance({ bottom: 84 }, dpToPx)).to.equal(112);
    });

    it("uses the safe area when it is the larger of the two", function () {
        expect(bottomClearance({ bottom: 200 }, dpToPx)).to.equal(200);
    });

    // Three-button navigation in landscape puts the bar on the right edge and
    // reports no bottom source at all — there is no strip to clear, so reserving
    // one would be dead space.
    it("reserves nothing when there is no inset at the bottom", function () {
        expect(bottomClearance({ bottom: 0 }, dpToPx)).to.equal(0);
    });

    it("treats a missing bottom the same as none", function () {
        expect(bottomClearance({}, dpToPx)).to.equal(0);
    });
});

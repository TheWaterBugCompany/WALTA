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

    it("still clears the gesture strip when there is no safe area at all", function () {
        expect(bottomClearance({ bottom: 0 }, dpToPx)).to.equal(112);
    });

    it("treats a missing bottom as none", function () {
        expect(bottomClearance({}, dpToPx)).to.equal(112);
    });
});

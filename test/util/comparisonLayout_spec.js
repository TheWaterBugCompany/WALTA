require("mocha");
const { expect } = require("chai");
const comparisonLayout = require("../../walta-app/app/lib/util/comparisonLayout");

// The four devices the visual suite runs on, in the dp the app sees them in.
const NEXUS_5 = { relWidth: 640, relHeight: 360 };
const IPHONE_17 = { relWidth: 852, relHeight: 393 };
const MEDIUM_PHONE = { relWidth: 914, relHeight: 411 };
const PRO_MAX = { relWidth: 956, relHeight: 440 };

function layoutFor(screen) {
    return comparisonLayout(Object.assign({ isHighRes: true, isXHighRes: false }, screen));
}

describe("comparisonLayout", function () {
    // Two photo entries side by side plus the padding either side is the whole
    // width of the modal, so the card can only be as wide as half of what the
    // screen leaves after the marks and the margins.
    it("keeps the modal inside the screen it is on", function () {
        [NEXUS_5, IPHONE_17, MEDIUM_PHONE, PRO_MAX].forEach((screen) => {
            const l = layoutFor(screen);
            expect(l.modalWidth, `modal on a ${screen.relWidth}dp screen`).to.be.at.most(screen.relWidth);
        });
    });

    it("keeps the modal inside the height it is on", function () {
        [NEXUS_5, IPHONE_17, MEDIUM_PHONE, PRO_MAX].forEach((screen) => {
            const l = layoutFor(screen);
            expect(l.modalHeight, `modal on a ${screen.relHeight}dp screen`).to.be.at.most(screen.relHeight);
        });
    });

    // The photos are the point of the screen, so whichever budget runs out
    // first is the one that sets the size — and the other should have slack,
    // never the other way round.
    it("grows the card until one budget is spent", function () {
        [NEXUS_5, IPHONE_17, MEDIUM_PHONE, PRO_MAX].forEach((screen) => {
            const l = layoutFor(screen);
            const widthSpent = screen.relWidth - l.modalWidth;
            const heightSpent = screen.relHeight - l.modalHeight;
            expect(Math.min(widthSpent, heightSpent), `slack on ${screen.relWidth}x${screen.relHeight}`)
                .to.be.below(l.cardWidth / 4);
        });
    });

    // A photograph stretched to fit its box stops looking like the creature.
    it("keeps the card at the photos' 4:3 shape", function () {
        [NEXUS_5, IPHONE_17, MEDIUM_PHONE, PRO_MAX].forEach((screen) => {
            const l = layoutFor(screen);
            expect(l.cardWidth / l.cardHeight, `aspect on a ${screen.relWidth}dp screen`).to.be.closeTo(4 / 3, 0.02);
        });
    });

    // The whole point of the card: a roomier screen gets a bigger photo rather
    // than the one the smallest screen in its bucket can take.
    it("gives a bigger screen a bigger photo", function () {
        const small = layoutFor(NEXUS_5), large = layoutFor(PRO_MAX);
        expect(large.cardWidth).to.be.greaterThan(small.cardWidth);
        expect(large.cardHeight).to.be.greaterThan(small.cardHeight);
    });

    // The narrow phone is the one the reported defect came from: two photos
    // must still fit across it.
    it("still fits two photos across the narrowest phone", function () {
        const l = layoutFor(NEXUS_5);
        expect(l.modalWidth).to.be.at.most(640);
        expect(l.cardWidth).to.be.greaterThan(0);
    });
});

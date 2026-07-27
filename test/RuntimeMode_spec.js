var { expect } = require("chai");
var RuntimeMode = require("../walta-app/app/lib/util/RuntimeMode");

// `app/lib/util/RuntimeMode.js` reads its launch-arg signal off the
// global `Ti` runtime, but to keep the helper unit-testable in node we
// pass `Ti` in as an argument. The dispatcher in `app/controllers/index.js`
// is the only place that hands it the real `Ti`.

function fakeAndroidTi(extras) {
    return {
        Platform: { osname: "android" },
        Android: {
            currentActivity: {
                intent: {
                    getBooleanExtra: function (key, fallback) {
                        return key in extras ? extras[key] : fallback;
                    },
                },
            },
        },
    };
}

function fakeIosTi(properties) {
    return {
        Platform: { osname: "iphone" },
        App: {
            Properties: {
                getString: function (key) {
                    return key in properties ? properties[key] : null;
                },
            },
        },
    };
}

describe("RuntimeMode.isUnitTestRun", function () {
    describe("Android", function () {
        it("returns true when the unit_test intent extra is true", function () {
            const ti = fakeAndroidTi({ unit_test: true });
            expect(RuntimeMode.isUnitTestRun(ti)).to.be.true;
        });

        it("returns false when the unit_test intent extra is false", function () {
            const ti = fakeAndroidTi({ unit_test: false });
            expect(RuntimeMode.isUnitTestRun(ti)).to.be.false;
        });

        it("returns false when the intent has no unit_test extra", function () {
            const ti = fakeAndroidTi({});
            expect(RuntimeMode.isUnitTestRun(ti)).to.be.false;
        });

        it("returns false when there is no current activity", function () {
            const ti = { Platform: { osname: "android" }, Android: { currentActivity: null } };
            expect(RuntimeMode.isUnitTestRun(ti)).to.be.false;
        });
    });

    describe("iOS", function () {
        it("returns true when Ti.App.Properties returns 'true' for unit_test", function () {
            const ti = fakeIosTi({ unit_test: "true" });
            expect(RuntimeMode.isUnitTestRun(ti)).to.be.true;
        });

        it("returns true when Ti.App.Properties returns '1' for unit_test", function () {
            // iOS argv merging into NSUserDefaults coerces booleans to "1" sometimes.
            const ti = fakeIosTi({ unit_test: "1" });
            expect(RuntimeMode.isUnitTestRun(ti)).to.be.true;
        });

        it("returns false when Ti.App.Properties returns null", function () {
            const ti = fakeIosTi({});
            expect(RuntimeMode.isUnitTestRun(ti)).to.be.false;
        });

        it("returns false when Ti.App.Properties returns 'false'", function () {
            const ti = fakeIosTi({ unit_test: "false" });
            expect(RuntimeMode.isUnitTestRun(ti)).to.be.false;
        });
    });

    describe("error handling", function () {
        it("returns false (defensive) when Ti throws unexpectedly", function () {
            const ti = {
                Platform: { osname: "android" },
                Android: { get currentActivity() { throw new Error("boom"); } },
            };
            expect(RuntimeMode.isUnitTestRun(ti)).to.be.false;
        });
    });
});

describe("RuntimeMode.isVisualCaptureRun", function () {
    it("returns true when the Android visual_capture intent extra is true", function () {
        expect(RuntimeMode.isVisualCaptureRun(fakeAndroidTi({ visual_capture: true }))).to.be.true;
    });

    it("returns false when the Android intent has no visual_capture extra", function () {
        expect(RuntimeMode.isVisualCaptureRun(fakeAndroidTi({}))).to.be.false;
    });

    it("returns true when iOS Ti.App.Properties returns 'true' for visual_capture", function () {
        expect(RuntimeMode.isVisualCaptureRun(fakeIosTi({ visual_capture: "true" }))).to.be.true;
    });

    it("returns false when iOS Ti.App.Properties returns null", function () {
        expect(RuntimeMode.isVisualCaptureRun(fakeIosTi({}))).to.be.false;
    });

    it("is independent of the unit_test flag", function () {
        expect(RuntimeMode.isVisualCaptureRun(fakeIosTi({ unit_test: "true" }))).to.be.false;
    });
});

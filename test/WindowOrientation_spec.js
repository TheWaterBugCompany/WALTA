require("mocha");
const { expect } = require("chai");
const { holdCurrentOrientation } = require("../walta-app/app/lib/ui/WindowOrientation");

const LANDSCAPE_LEFT = 4, LANDSCAPE_RIGHT = 3;

function fakeWindow(uiOrientation, declaredModes) {
    return { orientation: uiOrientation, orientationModes: declaredModes };
}

function fakeGesture() {
    const listeners = {};
    return {
        addEventListener(name, fn) { (listeners[name] = listeners[name] || []).push(fn); },
        removeEventListener(name, fn) {
            listeners[name] = (listeners[name] || []).filter((l) => l !== fn);
        },
        fire(name) { (listeners[name] || []).slice().forEach((fn) => fn()); },
        count(name) { return (listeners[name] || []).length; }
    };
}

describe("WindowOrientation", function () {

    it("holds the window in the orientation the interface is already in", function () {
        const win = fakeWindow(LANDSCAPE_RIGHT, [LANDSCAPE_LEFT, LANDSCAPE_RIGHT]);
        holdCurrentOrientation(win, fakeGesture());
        expect(win.orientationModes).to.deep.equal([LANDSCAPE_RIGHT]);
    });

    it("gives back the declared orientations once the device reports one", function () {
        const win = fakeWindow(LANDSCAPE_RIGHT, [LANDSCAPE_LEFT, LANDSCAPE_RIGHT]);
        const gesture = fakeGesture();
        holdCurrentOrientation(win, gesture);
        gesture.fire("orientationchange");
        expect(win.orientationModes).to.deep.equal([LANDSCAPE_LEFT, LANDSCAPE_RIGHT]);
    });

    it("stops listening once it has given them back", function () {
        const gesture = fakeGesture();
        holdCurrentOrientation(fakeWindow(LANDSCAPE_RIGHT, [LANDSCAPE_LEFT, LANDSCAPE_RIGHT]), gesture);
        gesture.fire("orientationchange");
        expect(gesture.count("orientationchange")).to.equal(0);
    });
});

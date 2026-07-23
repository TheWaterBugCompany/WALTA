require("mocha");
const { expect } = require("chai");
const isSessionDeadError = require("../features/support/is-session-dead-error");

describe("isSessionDeadError", function () {
    // The signatures WDA/Appium emit when the underlying session has collapsed.
    // These mean "the driver is gone" — categorically different from an element
    // that simply isn't on screen yet.
    const deadSignatures = [
        'A session is either terminated or not started when running "element" with method "POST"',
        "invalid session id",
        "Invalid Session ID",
        "A session is either terminated or not started",
    ];

    deadSignatures.forEach(msg => {
        it(`treats "${msg.slice(0, 40)}..." as a dead session`, function () {
            expect(isSessionDeadError(new Error(msg))).to.be.true;
        });
    });

    // A missing element with a live session must NOT read as session death,
    // or the poll would bail on every not-yet-rendered widget.
    it("does not treat an element-not-found error as session death", function () {
        expect(isSessionDeadError(new Error("no such element: unable to locate element ~Foo."))).to.be.false;
    });

    it("does not treat an assertion failure as session death", function () {
        expect(isSessionDeadError(new Error("expected 'Log In' to equal 'You are Logged in'"))).to.be.false;
    });

    it("is safe on a null/undefined error", function () {
        expect(isSessionDeadError(null)).to.be.false;
        expect(isSessionDeadError(undefined)).to.be.false;
    });
});

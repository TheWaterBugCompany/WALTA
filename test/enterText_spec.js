require("mocha");
const { expect } = require("chai");
const enterText = require("../features/support/enter-text");
const { FIELD_DID_NOT_TAKE_TEXT } = require("../features/support/environmental-failures");

// Fakes the three IO seams against a field that holds whatever the last landed
// write put in it. `dropFirst` writes that WebDriverAgent answers 200 to and
// that never reach the field — the real failure this guards.
function fakeField({ dropFirst = 0 } = {}) {
    let held = "";
    let writes = 0;
    let clock = 0;
    return {
        writes: () => writes,
        held: () => held,
        write: async (text) => { writes++; if (writes > dropFirst) held = text; },
        read: async () => held,
        blur: async () => { clock += 500; },
        now: () => clock,
    };
}

describe("enterText", function () {
    it("leaves the text in the field and writes once when the write lands", async function () {
        const f = fakeField();
        await enterText({ field: "Edge Plants", text: "10", ...f });
        expect(f.held()).to.equal("10");
        expect(f.writes()).to.equal(1);
    });

    // WebDriverAgent answers 200 to a setValue that typed into nothing — the
    // field had not taken focus. Unchecked, that write is silent and the run
    // fails much later on a screen that never advances.
    it("writes again when the field did not take the text", async function () {
        const f = fakeField({ dropFirst: 2 });
        await enterText({ field: "Edge Plants", text: "10", ...f });
        expect(f.held()).to.equal("10");
        expect(f.writes()).to.equal(3);
    });

    // Named and carrying the field, so the failure says what happened where it
    // happened rather than surfacing as a screen that would not advance.
    it("fails by name, naming the field, when the text never lands", async function () {
        const f = fakeField({ dropFirst: Infinity });
        let err = null;
        try {
            await enterText({ field: "Edge Plants", text: "10", ...f, timeoutMs: 2000 });
        } catch (e) { err = e; }
        expect(err).to.be.an("error");
        expect(err.message).to.include(FIELD_DID_NOT_TAKE_TEXT);
        expect(err.message).to.include("Edge Plants");
    });

    // iOS gives a TextArea's accessibility label as its value, so the typed
    // text is not readable at all. Such a field is unobservable rather than
    // wrong, and re-typing into it would spend the whole budget every time.
    it("takes the write on trust when the field reads back as its own name", async function () {
        const f = fakeField({ dropFirst: Infinity });
        f.read = async () => "Notes";
        const writes = await enterText({ field: "Notes", text: "some notes", ...f });
        expect(writes).to.equal(1);
    });

    // A write that was swallowed reads back empty; a read looking in the wrong
    // place reads back something else. The message has to tell those apart.
    it("says what the field held instead", async function () {
        const f = fakeField({ dropFirst: Infinity });
        f.read = async () => "the placeholder";
        let err = null;
        try {
            await enterText({ field: "Notes", text: "10", ...f, timeoutMs: 2000 });
        } catch (e) { err = e; }
        expect(err.message).to.include('holds "the placeholder"');
    });
});

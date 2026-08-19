require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var Topics = require("ui/Topics");
var AppReset = require("util/AppReset");

// WB-103: walta://reset clears the session, so it is a logout. It must fire
// LOGGEDOUT so SampleSync (the subscriber) cancels any sync that was started
// against the now-cleared token — otherwise a stale sync races the next login.
describe("AppReset", function () {
    var savedApi;
    beforeEach(function () {
        // reset() only needs storeUserToken; isolate from other specs that
        // leave a global CerdiApi mock without it.
        savedApi = Alloy.Globals.CerdiApi;
        Alloy.Globals.CerdiApi = { storeUserToken: function () {} };
    });
    afterEach(function () {
        Alloy.Globals.CerdiApi = savedApi;
    });

    // reset() quiesces any in-flight sync before announcing the logout, so it
    // is async now (WB-116) — LOGGEDOUT fires after the returned promise's
    // await, hence we await reset() before asserting and unsubscribing.
    it("fires LOGGEDOUT so subscribers can cancel work tied to the session", async function () {
        var fired = false;
        function onLoggedOut() { fired = true; }
        Topics.subscribe(Topics.LOGGEDOUT, onLoggedOut);
        try {
            await AppReset.reset();
        } finally {
            Topics.unsubscribe(Topics.LOGGEDOUT, onLoggedOut);
        }
        expect(fired, "AppReset.reset() should fire Topics.LOGGEDOUT").to.be.true;
    });

    // Navigation caches the current sample in memory (seeded via SURVEY_STARTED);
    // clearing the DB alone leaves it pointing at the prior scenario's dirty
    // sample, which then trips the unsaved-changes guard on the next navigation.
    // reset must re-seed a fresh, clean sample the same way startup does.
    it("re-seeds Navigation with a clean sample so edits don't leak past the reset", async function () {
        var seeded = null;
        function onSurveyStarted(data) { seeded = data; }
        Topics.subscribe(Topics.SURVEY_STARTED, onSurveyStarted);
        try {
            await AppReset.reset();
        } finally {
            Topics.unsubscribe(Topics.SURVEY_STARTED, onSurveyStarted);
        }
        expect(seeded, "AppReset.reset() should re-fire SURVEY_STARTED").to.not.be.null;
        expect(await seeded.sample.hasUnsavedChanges(),
            "the re-seeded sample must be clean").to.be.false;
    });
});

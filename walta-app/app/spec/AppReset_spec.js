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
});

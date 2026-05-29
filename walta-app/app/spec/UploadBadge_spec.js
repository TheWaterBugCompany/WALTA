var { expect } = require("spec/lib/chai");
var Topics = require("ui/Topics");
var { init, SYNC_RECOMMENDED_KEY } = require("logic/UploadBadge");

// On-device wiring: the pure decision/state is covered by the node specs;
// this proves the real Topics events drive the badge end-to-end (up to the
// platform appBadge call, stubbed here via setBadge).
describe("UploadBadge (device wiring)", function () {
    let badges, badge, pending, probeAnswer;

    beforeEach(function () {
        Ti.App.Properties.setBool(SYNC_RECOMMENDED_KEY, false);
        badges = [];
        pending = 0;
        probeAnswer = true;
        badge = init({
            properties: Ti.App.Properties,
            pendingCount: () => pending,
            checkSyncNeeded: () => Promise.resolve(probeAnswer),
            setBadge: (n) => badges.push(n),
            topics: Topics,
        });
    });

    afterEach(function () {
        if (badge && badge.dispose) badge.dispose();
        Ti.App.Properties.setBool(SYNC_RECOMMENDED_KEY, false);
    });

    function lastBadge() { return badges[badges.length - 1]; }

    it("shows the badge after login when the probe says a sync is needed", async function () {
        probeAnswer = true;
        Topics.fireTopicEvent(Topics.LOGGEDIN);
        await badge.probe();
        expect(lastBadge()).to.equal(1);
    });

    it("does not show the badge after login when the probe says nothing is needed", async function () {
        probeAnswer = false;
        Topics.fireTopicEvent(Topics.LOGGEDIN);
        await badge.probe();
        expect(lastBadge()).to.equal(0);
    });

    it("reflects pending uploads on local activity without adding the recommendation", function () {
        pending = 2;
        Topics.fireTopicEvent(Topics.FORCE_UPLOAD);
        expect(lastBadge()).to.equal(2);
    });

    it("clears the badge after a successful full sync", async function () {
        probeAnswer = true;
        Topics.fireTopicEvent(Topics.LOGGEDIN);
        await badge.probe();
        Topics.fireTopicEvent(Topics.SYNC_FINISHED, { success: true, fullSync: true });
        expect(lastBadge()).to.equal(0);
    });

    it("re-probes after an upload-only sync (keeps the badge truthful between full syncs)", async function () {
        probeAnswer = true;
        Topics.fireTopicEvent(Topics.LOGGEDIN);
        await badge.probe();
        probeAnswer = false;
        Topics.fireTopicEvent(Topics.SYNC_FINISHED, { success: true, fullSync: false });
        await badge.probe();
        expect(lastBadge()).to.equal(0);
    });

    it("clears the badge on logout", async function () {
        probeAnswer = true;
        Topics.fireTopicEvent(Topics.LOGGEDIN);
        await badge.probe();
        Topics.fireTopicEvent(Topics.LOGGEDOUT);
        expect(lastBadge()).to.equal(0);
    });
});

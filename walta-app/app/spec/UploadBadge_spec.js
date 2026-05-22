var { expect } = require("spec/lib/chai");
var Topics = require("ui/Topics");
var { init, SYNC_RECOMMENDED_KEY } = require("logic/UploadBadge");

// On-device wiring: the pure decision/state is covered by the node specs;
// this proves the real Topics events drive the badge end-to-end (up to the
// platform appBadge call, stubbed here via setBadge).
describe("UploadBadge (device wiring)", function () {
    let badges, badge, pending;

    beforeEach(function () {
        Ti.App.Properties.setBool(SYNC_RECOMMENDED_KEY, false);
        badges = [];
        pending = 0;
        badge = init({
            properties: Ti.App.Properties,
            pendingCount: () => pending,
            setBadge: (n) => badges.push(n),
            topics: Topics,
        });
    });

    afterEach(function () {
        if (badge && badge.dispose) badge.dispose();
        Ti.App.Properties.setBool(SYNC_RECOMMENDED_KEY, false);
    });

    function lastBadge() { return badges[badges.length - 1]; }

    it("shows the badge when login is broadcast via Topics", function () {
        Topics.fireTopicEvent(Topics.LOGGEDIN);
        expect(lastBadge()).to.equal(1);
    });

    it("reflects pending uploads on local activity without adding the recommendation", function () {
        pending = 2;
        Topics.fireTopicEvent(Topics.FORCE_UPLOAD);
        expect(lastBadge()).to.equal(2);
    });

    it("clears the badge after a successful full sync", function () {
        Topics.fireTopicEvent(Topics.LOGGEDIN);
        Topics.fireTopicEvent(Topics.SYNC_FINISHED, { success: true, fullSync: true });
        expect(lastBadge()).to.equal(0);
    });

    it("keeps the badge after an upload-only sync (history still not pulled)", function () {
        Topics.fireTopicEvent(Topics.LOGGEDIN);
        Topics.fireTopicEvent(Topics.SYNC_FINISHED, { success: true, fullSync: false });
        expect(lastBadge()).to.equal(1);
    });

    it("clears the badge on logout", function () {
        Topics.fireTopicEvent(Topics.LOGGEDIN);
        Topics.fireTopicEvent(Topics.LOGGEDOUT);
        expect(lastBadge()).to.equal(0);
    });
});

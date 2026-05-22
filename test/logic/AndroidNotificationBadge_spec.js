require("mocha");
const { expect } = require("chai");
const { createAndroidBadgeSetter } = require("../../walta-app/app/lib/logic/AndroidNotificationBadge");

describe("AndroidNotificationBadge", function () {
  let channels, notifications, cancels, setBadge;

  beforeEach(function () {
    channels = [];
    notifications = [];
    cancels = [];
    setBadge = createAndroidBadgeSetter({
      importanceLow: "LOW",
      createChannel: (spec) => { channels.push(spec); return spec; },
      createNotification: (spec) => ({ spec }),
      notify: (id, notification) => notifications.push({ id, notification }),
      cancel: (id) => cancels.push(id),
    });
  });

  describe("notification channel", function () {
    it("creates a badge-enabled, low-importance channel on first use", function () {
      setBadge(1);
      expect(channels).to.have.length(1);
      expect(channels[0].showBadge).to.equal(true);
      expect(channels[0].importance).to.equal("LOW");
    });

    it("creates the channel only once across multiple updates", function () {
      setBadge(1);
      setBadge(2);
      setBadge(0);
      expect(channels).to.have.length(1);
    });
  });

  describe("posting and clearing", function () {
    it("posts an ongoing notification carrying the badge count when positive", function () {
      setBadge(3);
      expect(notifications).to.have.length(1);
      expect(notifications[0].notification.spec.number).to.equal(3);
      expect(notifications[0].notification.spec.ongoing).to.equal(true);
    });

    it("posts to the badge channel", function () {
      setBadge(1);
      expect(notifications[0].notification.spec.channelId).to.equal(channels[0].id);
    });

    it("cancels the notification when the badge clears to zero", function () {
      setBadge(2);
      setBadge(0);
      expect(cancels).to.have.length(1);
      expect(cancels[0]).to.equal(notifications[0].id);
    });

    it("does not post a notification when starting cleared", function () {
      setBadge(0);
      expect(notifications).to.have.length(0);
      expect(cancels).to.have.length(1);
    });
  });
});

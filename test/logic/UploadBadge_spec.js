require("mocha");
const { expect } = require("chai");
const { createUploadBadge, init } = require("../../walta-app/app/lib/logic/UploadBadge");

describe("UploadBadge", function () {
  let store, pending, badges, badge;

  // Fake Ti.App.Properties-style boolean store.
  function fakeProperties() {
    const props = {};
    return {
      getBool: (k, d) => (k in props ? props[k] : d),
      setBool: (k, v) => { props[k] = v; },
    };
  }

  beforeEach(function () {
    store = fakeProperties();
    pending = 0;
    badges = [];
    badge = createUploadBadge({
      properties: store,
      pendingCount: () => pending,
      setBadge: (n) => badges.push(n),
    });
  });

  function lastBadge() { return badges[badges.length - 1]; }

  describe("value — pending uploads plus one when a full sync is recommended", function () {
    it("is 0 when nothing is pending and no sync is recommended", function () {
      expect(badge.value()).to.equal(0);
    });

    it("counts pending uploads when no sync is recommended", function () {
      pending = 2;
      expect(badge.value()).to.equal(2);
    });

    it("adds one to the pending count when a sync is recommended", function () {
      pending = 2;
      badge.onLogin();
      expect(badge.value()).to.equal(3);
    });

    it("is just 1 when a sync is recommended but nothing is pending", function () {
      badge.onLogin();
      expect(badge.value()).to.equal(1);
    });
  });

  describe("state transitions", function () {
    it("recommends a sync after login (historical samples not yet pulled)", function () {
      badge.onLogin();
      expect(badge.value()).to.equal(1);
    });

    it("does not add the recommendation on local activity — the new sample shows via the pending count", function () {
      pending = 1;
      badge.onLocalActivity();
      expect(badge.value()).to.equal(1);
    });

    it("clears the recommendation when a full sync completes successfully", function () {
      badge.onLogin();
      badge.onSyncFinished({ success: true, fullSync: true });
      expect(badge.value()).to.equal(0);
    });

    it("keeps the recommendation after an upload-only sync (history still not pulled)", function () {
      badge.onLogin();
      badge.onSyncFinished({ success: true, fullSync: false });
      expect(badge.value()).to.equal(1);
    });

    it("keeps the recommendation when a full sync fails", function () {
      badge.onLogin();
      badge.onSyncFinished({ success: false, fullSync: true });
      expect(badge.value()).to.equal(1);
    });

    it("clears the recommendation on logout", function () {
      badge.onLogin();
      badge.onLogout();
      expect(badge.value()).to.equal(0);
    });

    it("still counts queued uploads after a full sync clears the recommendation", function () {
      badge.onLogin();
      pending = 3;
      badge.onSyncFinished({ success: true, fullSync: true });
      expect(badge.value()).to.equal(3);
    });
  });

  describe("badge side-effects", function () {
    it("sets the badge to the pending count plus the recommendation", function () {
      pending = 2;
      badge.onLogin();
      expect(lastBadge()).to.equal(3);
    });

    it("clears the badge to 0 when nothing is pending and not recommended", function () {
      badge.onLogin();
      badge.onLogout();
      expect(lastBadge()).to.equal(0);
    });
  });

  describe("init wiring", function () {
    function fakeTopics() {
      const subs = {};
      return {
        LOGGEDIN: "loggedin", LOGGEDOUT: "loggedout",
        FORCE_UPLOAD: "forceupload", SYNC_FINISHED: "syncfinished",
        subscribe: (t, cb) => { (subs[t] = subs[t] || []).push(cb); },
        unsubscribe: (t, cb) => { subs[t] = (subs[t] || []).filter((c) => c !== cb); },
        fire: (t, e) => (subs[t] || []).forEach((cb) => cb(e)),
      };
    }

    function wire(topics, extra) {
      return init(Object.assign({
        properties: store, pendingCount: () => pending, setBadge: (n) => badges.push(n), topics,
      }, extra));
    }

    it("reflects pending uploads on FORCE_UPLOAD without adding the recommendation", function () {
      const topics = fakeTopics();
      wire(topics);
      pending = 2;
      topics.fire(topics.FORCE_UPLOAD);
      expect(lastBadge()).to.equal(2);
    });

    it("recommends after login and clears after a successful full sync", function () {
      const topics = fakeTopics();
      const b = wire(topics);
      topics.fire(topics.LOGGEDIN);
      expect(b.value()).to.equal(1);
      topics.fire(topics.SYNC_FINISHED, { success: true, fullSync: true });
      expect(b.value()).to.equal(0);
    });

    it("clears on logout", function () {
      const topics = fakeTopics();
      const b = wire(topics);
      topics.fire(topics.LOGGEDIN);
      topics.fire(topics.LOGGEDOUT);
      expect(b.value()).to.equal(0);
    });

    it("requests badge permission once and refreshes on init", function () {
      const topics = fakeTopics();
      let perm = 0;
      wire(topics, { requestPermission: () => perm++ });
      expect(perm).to.equal(1);
      expect(badges.length).to.be.greaterThan(0);
    });

    it("dispose() drops its Topics subscriptions", function () {
      const topics = fakeTopics();
      const b = wire(topics);
      b.dispose();
      const before = badges.length;
      topics.fire(topics.LOGGEDIN);
      expect(badges.length).to.equal(before);
    });
  });
});

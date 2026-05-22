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

  describe("shouldShow", function () {
    it("is false initially — nothing recommended and no pending uploads", function () {
      expect(badge.shouldShow()).to.equal(false);
    });

    it("is true when there are pending uploads even if a sync isn't recommended", function () {
      pending = 2;
      expect(badge.shouldShow()).to.equal(true);
    });
  });

  describe("state transitions", function () {
    it("recommends a sync after login (historical samples not yet pulled)", function () {
      badge.onLogin();
      expect(badge.shouldShow()).to.equal(true);
    });

    it("recommends a sync after local activity (new/edited sample)", function () {
      badge.onLocalActivity();
      expect(badge.shouldShow()).to.equal(true);
    });

    it("clears the recommendation when a full sync completes successfully", function () {
      badge.onLogin();
      badge.onSyncFinished({ success: true, fullSync: true });
      expect(badge.shouldShow()).to.equal(false);
    });

    it("keeps the recommendation after an upload-only sync (history still not pulled)", function () {
      badge.onLogin();
      badge.onSyncFinished({ success: true, fullSync: false });
      expect(badge.shouldShow()).to.equal(true);
    });

    it("keeps the recommendation when a full sync fails", function () {
      badge.onLogin();
      badge.onSyncFinished({ success: false, fullSync: true });
      expect(badge.shouldShow()).to.equal(true);
    });

    it("clears the recommendation on logout", function () {
      badge.onLogin();
      badge.onLogout();
      expect(badge.shouldShow()).to.equal(false);
    });

    it("still shows after a cleared recommendation while uploads remain queued", function () {
      badge.onLogin();
      pending = 1;
      badge.onSyncFinished({ success: true, fullSync: true });
      expect(badge.shouldShow()).to.equal(true);
    });
  });

  describe("badge side-effects", function () {
    it("sets the badge to 1 when the indicator should show", function () {
      badge.onLogin();
      expect(badges[badges.length - 1]).to.equal(1);
    });

    it("clears the badge to 0 when the indicator should not show", function () {
      badge.onLogin();
      badge.onLogout();
      expect(badges[badges.length - 1]).to.equal(0);
    });
  });

  describe("init wiring", function () {
    function fakeTopics() {
      const subs = {};
      return {
        LOGGEDIN: "loggedin", LOGGEDOUT: "loggedout",
        FORCE_UPLOAD: "forceupload", SYNC_FINISHED: "syncfinished",
        subscribe: (t, cb) => { (subs[t] = subs[t] || []).push(cb); },
        fire: (t, e) => (subs[t] || []).forEach((cb) => cb(e)),
      };
    }

    function wire(topics, extra) {
      return init(Object.assign({
        properties: store, pendingCount: () => pending, setBadge: (n) => badges.push(n), topics,
      }, extra));
    }

    it("recommends a sync when a sample is submitted (FORCE_UPLOAD)", function () {
      const topics = fakeTopics();
      const b = wire(topics);
      topics.fire(topics.FORCE_UPLOAD);
      expect(b.shouldShow()).to.equal(true);
      expect(badges[badges.length - 1]).to.equal(1);
    });

    it("recommends after login and clears after a successful full sync", function () {
      const topics = fakeTopics();
      const b = wire(topics);
      topics.fire(topics.LOGGEDIN);
      expect(b.shouldShow()).to.equal(true);
      topics.fire(topics.SYNC_FINISHED, { success: true, fullSync: true });
      expect(b.shouldShow()).to.equal(false);
    });

    it("clears on logout", function () {
      const topics = fakeTopics();
      const b = wire(topics);
      topics.fire(topics.LOGGEDIN);
      topics.fire(topics.LOGGEDOUT);
      expect(b.shouldShow()).to.equal(false);
    });

    it("requests badge permission once and refreshes on init", function () {
      const topics = fakeTopics();
      let perm = 0;
      wire(topics, { requestPermission: () => perm++ });
      expect(perm).to.equal(1);
      expect(badges.length).to.be.greaterThan(0);
    });
  });
});

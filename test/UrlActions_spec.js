require("mocha");
const { expect } = require("chai");
const sinon = require("sinon");
const UrlActions = require("../walta-app/app/lib/UrlActions");

describe("UrlActions", function () {
  let cerdiApi, onLoggedIn, actions;

  beforeEach(function () {
    cerdiApi = { loginUser: sinon.stub().resolves({ accessToken: "tok" }) };
    onLoggedIn = sinon.stub();
    actions = UrlActions.create({ cerdiApi, onLoggedIn });
  });

  describe("dispatch(login)", function () {
    it("calls loginUser with the email and password from the URL", async function () {
      await actions.dispatch("walta://login?email=a@b.c&password=p");
      expect(cerdiApi.loginUser.calledOnce).to.be.true;
      expect(cerdiApi.loginUser.firstCall.args).to.deep.equal(["a@b.c", "p"]);
    });

    it("fires the onLoggedIn callback after the login promise resolves", async function () {
      await actions.dispatch("walta://login?email=a@b.c&password=p");
      expect(onLoggedIn.calledOnce).to.be.true;
      expect(onLoggedIn.calledAfter(cerdiApi.loginUser)).to.be.true;
    });

    it("decodes percent-encoded params (e.g. @ in the email)", async function () {
      await actions.dispatch("walta://login?email=a%40b.c&password=p%20w");
      expect(cerdiApi.loginUser.firstCall.args).to.deep.equal(["a@b.c", "p w"]);
    });

    it("does not fire onLoggedIn when login rejects", async function () {
      cerdiApi.loginUser = sinon.stub().rejects(new Error("bad creds"));
      const promise = actions.dispatch("walta://login?email=a@b.c&password=wrong");
      await promise.catch(() => {}); // swallow — we just want to inspect side-effects
      expect(onLoggedIn.called).to.be.false;
    });
  });

  describe("dispatch(ballast)", function () {
    // Dev-only WB-118 repro knob — gated behind a setBallast callback that
    // index-app.js only supplies on non-production builds, like reset.
    it("registers the ballast action and calls setBallast with the parsed mb", async function () {
      const setBallast = sinon.stub();
      const withBallast = UrlActions.create({ cerdiApi, onLoggedIn, setBallast });
      await withBallast.dispatch("walta://ballast?mb=256");
      expect(setBallast.calledOnceWith(256)).to.equal(true);
    });

    it("does not register the ballast action without a setBallast callback", function () {
      expect(actions.dispatch("walta://ballast?mb=256")).to.equal(undefined);
    });
  });

  describe("dispatch (invalid input)", function () {
    it("ignores non-walta schemes", function () {
      const result = actions.dispatch("https://example.com/login?email=a@b.c");
      expect(result).to.be.undefined;
      expect(cerdiApi.loginUser.called).to.be.false;
    });

    it("ignores unknown action names", function () {
      const result = actions.dispatch("walta://nope?foo=bar");
      expect(result).to.be.undefined;
      expect(cerdiApi.loginUser.called).to.be.false;
    });

    it("ignores malformed URLs without throwing", function () {
      expect(() => actions.dispatch("not a url at all")).to.not.throw();
      expect(cerdiApi.loginUser.called).to.be.false;
    });

    it("ignores null/undefined input", function () {
      expect(() => actions.dispatch(null)).to.not.throw();
      expect(() => actions.dispatch(undefined)).to.not.throw();
    });
  });

  describe("registry", function () {
    it("exposes the action registry so future actions can be registered", function () {
      expect(actions.actions.login).to.exist;
      expect(actions.actions.login.params).to.deep.equal(["email", "password"]);
      expect(actions.actions.login.handler).to.be.a("function");
    });
  });

  describe("dispatch(reset)", function () {
    // The reset action is the cucumber Before-hook fast path — replaces a
    // slow `terminateApp + launch + poll` cycle. Production builds must not
    // register it (a stray walta://reset URL must not wipe user data), so
    // the action is gated behind an `appReset` callback that index-app.js
    // only passes in non-production builds.
    it("registers the reset action and invokes appReset when called", async function () {
      const appReset = sinon.stub();
      const withReset = UrlActions.create({ cerdiApi, onLoggedIn, appReset });
      expect(withReset.actions.reset).to.exist;
      expect(withReset.actions.reset.params).to.deep.equal([]);
      await withReset.dispatch("walta://reset");
      expect(appReset.calledOnce).to.be.true;
    });

    it("omits the reset action when no appReset callback is provided", function () {
      // production-build safety: if index-app.js doesn't pass appReset
      // (because Ti.App.deployType === 'production'), the action is absent
      // from the registry and a walta://reset URL is silently ignored.
      expect(actions.actions.reset).to.be.undefined;
      const result = actions.dispatch("walta://reset");
      expect(result).to.be.undefined;
    });
  });
});

require("mocha");
const { expect } = require("chai");
const sinon = require("sinon");
const UrlActions = require("../walta-app/app/lib/UrlActions");

describe("UrlActions.create (deeplink dispatch)", function () {
  const MemoryBallast = require("util/MemoryBallast");
  let cerdiApi;
  beforeEach(function () {
    cerdiApi = { loginUser: sinon.stub().resolves({ accessToken: "tok" }), serverUrl: "x" };
    global.Alloy = { Events: { trigger: sinon.stub() } };
  });
  afterEach(function () {
    delete global.Alloy;
    MemoryBallast.deflate();
  });

  it("routes a walta:// url to the matching action with percent-decoded params", function () {
    UrlActions.create({ cerdiApi }).dispatch("walta://login?email=a%40b.c&password=p%20w");
    expect(cerdiApi.loginUser.calledOnceWith("a@b.c", "p w")).to.equal(true);
  });

  it("returns the handler's result so callers can await it", function () {
    const result = UrlActions.create({ cerdiApi, allowDev: true }).dispatch("walta://ballast?mb=1");
    expect(result).to.equal(1 * 1024 * 1024);
  });

  it("ignores non-walta schemes", function () {
    const result = UrlActions.create({ cerdiApi }).dispatch("https://example.com/login?email=a%40b.c");
    expect(cerdiApi.loginUser.notCalled).to.equal(true);
    expect(result).to.equal(undefined);
  });

  it("ignores unknown action names", function () {
    expect(UrlActions.create({ cerdiApi }).dispatch("walta://nope?foo=bar")).to.equal(undefined);
  });

  it("ignores malformed / null input without throwing", function () {
    const { dispatch } = UrlActions.create({ cerdiApi });
    expect(() => dispatch("not a url at all")).to.not.throw();
    expect(() => dispatch(null)).to.not.throw();
    expect(() => dispatch(undefined)).to.not.throw();
  });
});

describe("UrlActions.buildActions (declarative catalog)", function () {
  const MemoryBallast = require("util/MemoryBallast");
  let cerdiApi;
  beforeEach(function () {
    cerdiApi = { loginUser: sinon.stub().resolves({ accessToken: "tok" }), serverUrl: "x" };
    // Topics fires through Alloy.Events; shim the framework bus so the real
    // Topics module (ours) runs unmocked.
    global.Alloy = { Events: { trigger: sinon.stub() } };
  });
  afterEach(function () {
    delete global.Alloy;
    MemoryBallast.deflate();
  });

  it("login calls loginUser with the credentials and fires the LOGGEDIN topic after it resolves", async function () {
    const actions = UrlActions.buildActions({ cerdiApi });
    await actions.login({ email: "a@b.c", password: "p" });
    expect(cerdiApi.loginUser.calledOnceWith("a@b.c", "p")).to.equal(true);
    expect(global.Alloy.Events.trigger.calledOnceWith("waterbug:loggedin")).to.equal(true);
  });

  it("login does not fire LOGGEDIN when loginUser rejects", async function () {
    cerdiApi.loginUser = sinon.stub().rejects(new Error("bad creds"));
    const actions = UrlActions.buildActions({ cerdiApi });
    try { await actions.login({ email: "a@b.c", password: "p" }); } catch (e) { /* expected */ }
    expect(global.Alloy.Events.trigger.notCalled).to.equal(true);
  });

  // reset (wipe) and ballast (balloon memory) are dev-only — a release build
  // must never expose them to a stray URL. Gated on allowDev.
  it("omits reset and ballast when allowDev is false", function () {
    const actions = UrlActions.buildActions({ cerdiApi, allowDev: false });
    expect(actions.reset).to.equal(undefined);
    expect(actions.ballast).to.equal(undefined);
  });

  it("exposes reset and ballast when allowDev is true", function () {
    const actions = UrlActions.buildActions({ cerdiApi, allowDev: true });
    expect(actions.reset).to.be.a("function");
    expect(actions.ballast).to.be.a("function");
  });

  it("ballast inflates the real MemoryBallast buffer to the requested size", async function () {
    const actions = UrlActions.buildActions({ cerdiApi, allowDev: true });
    await actions.ballast({ mb: "1" });
    expect(MemoryBallast.heldBytes()).to.equal(1 * 1024 * 1024);
  });
});

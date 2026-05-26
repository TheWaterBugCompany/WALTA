require("mocha");
const { expect } = require("chai");
const sinon = require("sinon");
const UrlActions = require("../walta-app/app/lib/UrlActions");

describe("UrlActions.create (generic dispatcher)", function () {
  it("invokes the named action's handler with the parsed params", function () {
    const handler = sinon.stub();
    UrlActions.create({ greet: handler }).dispatch("walta://greet?name=ada");
    expect(handler.calledOnceWith({ name: "ada" })).to.equal(true);
  });

  it("decodes percent-encoded params (e.g. @ and spaces)", function () {
    const handler = sinon.stub();
    UrlActions.create({ login: handler }).dispatch("walta://login?email=a%40b.c&password=p%20w");
    expect(handler.calledOnceWith({ email: "a@b.c", password: "p w" })).to.equal(true);
  });

  it("returns the handler's result so callers can await it", async function () {
    const { dispatch } = UrlActions.create({ go: () => Promise.resolve("done") });
    expect(await dispatch("walta://go")).to.equal("done");
  });

  it("ignores non-walta schemes", function () {
    const handler = sinon.stub();
    const result = UrlActions.create({ login: handler }).dispatch("https://example.com/login?x=1");
    expect(handler.notCalled).to.equal(true);
    expect(result).to.equal(undefined);
  });

  it("ignores unknown action names", function () {
    expect(UrlActions.create({}).dispatch("walta://nope?foo=bar")).to.equal(undefined);
  });

  it("ignores malformed / null input without throwing", function () {
    const { dispatch } = UrlActions.create({});
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

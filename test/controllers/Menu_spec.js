require("mocha");
const { expect } = require("chai");
const createMenuController = require("../../walta-app/app/lib/mvvm/controllers/Menu");
const Topics = require("../../walta-app/app/lib/ui/Topics");

// Fake Ti widget: settable props + addEventListener/fireEvent.
function makeWidget(props) {
  const listeners = {};
  return Object.assign({
    addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    removeEventListener(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
    fireEvent(name, data) { (listeners[name] || []).forEach(cb => cb(data)); },
  }, props);
}

function makeView() {
  return {
    appVersion:      makeWidget({ text: "", color: null }),
    logInLabel:      makeWidget({ text: "", accessibilityLabel: "" }),
    logInOrRegister: makeWidget({}),
    detailed:        makeWidget({}),
    identify:        makeWidget({}),
    history:         makeWidget({}),
    gallery:         makeWidget({}),
    academy:         makeWidget({}),
    about:           makeWidget({}),
  };
}

function fakeCerdiApi(userToken) {
  let token = userToken;
  return {
    retrieveUserToken: () => token,
    storeUserToken: newToken => { token = newToken; },
  };
}

const PALETTE = { primary: "PRIMARY", errorDark: "ERRORDARK" };

// Let the async confirmLogout handler's awaited promise settle.
function flush() { return new Promise(resolve => setImmediate(resolve)); }

describe("Menu controller", function () {
  let view, cerdiApi, dialogs, ctl;

  function build({ userToken = null, environment = "production", version = "2.5.0.0", confirm = true } = {}) {
    view = makeView();
    cerdiApi = fakeCerdiApi(userToken);
    dialogs = {
      confirmCalls: [],
      confirm(opts) { dialogs.confirmCalls.push(opts); return Promise.resolve(confirm); },
    };
    ctl = createMenuController({
      view,
      services: { cerdiApi, topics: Topics, dialogs, environment, version },
      palette: PALETTE,
    });
  }

  afterEach(function () {
    if (ctl) ctl.dispose();
    ctl = null;
    Topics.reset();
  });

  function recordTopic(topic) {
    let fired = false;
    Topics.subscribe(topic, data => { fired = data || true; });
    return () => fired;
  }

  it("shows the version label and colour bound from the view-model", function () {
    build({ environment: "production", version: "2.5.0.0" });
    expect(view.appVersion.text).to.equal("v2.5.0.0");
    expect(view.appVersion.color).to.equal("PRIMARY");
  });

  it("flags the test server in the version label and colour off production", function () {
    build({ environment: "development", version: "2.5.0.0" });
    expect(view.appVersion.text).to.equal("Test Server v2.5.0.0");
    expect(view.appVersion.color).to.equal("ERRORDARK");
  });

  it("mirrors the login label into its accessibility label", function () {
    build({ userToken: "a-token" });
    expect(view.logInLabel.text).to.equal("You are Logged in");
    expect(view.logInLabel.accessibilityLabel).to.equal("You are Logged in");
  });

  it("fires the DETAILED topic when the survey button is tapped", function () {
    build();
    const fired = recordTopic(Topics.DETAILED);
    view.detailed.fireEvent("click");
    expect(fired()).to.be.true;
  });

  it("fires the GALLERY topic without the pager when the gallery is tapped", function () {
    build();
    const fired = recordTopic(Topics.GALLERY);
    view.gallery.fireEvent("click");
    expect(fired()).to.deep.equal({ showPager: false });
  });

  it("opens the identification-method chooser as a fresh identification when identify is tapped", function () {
    build();
    const fired = recordTopic(Topics.SELECT_METHOD);
    view.identify.fireEvent("click");
    expect(fired()).to.deep.equal({ allowAddToSample: false, surveyType: null });
  });

  it("goes to the login screen when the login button is tapped logged out", function () {
    build({ userToken: null });
    const fired = recordTopic(Topics.LOGIN);
    view.logInOrRegister.fireEvent("click");
    expect(fired()).to.be.true;
  });

  it("asks the dialog seam to confirm before logging out when tapped logged in", function () {
    build({ userToken: "a-token" });
    view.logInOrRegister.fireEvent("click");
    expect(dialogs.confirmCalls.length).to.equal(1);
    expect(dialogs.confirmCalls[0].confirmLabel).to.equal("Log Out");
  });

  it("logs out and relabels when the logout is confirmed", async function () {
    build({ userToken: "a-token", confirm: true });
    const loggedOut = recordTopic(Topics.LOGGEDOUT);
    view.logInOrRegister.fireEvent("click");
    await flush();
    expect(cerdiApi.retrieveUserToken()).to.equal(null);
    expect(loggedOut()).to.be.true;
    expect(view.logInLabel.text).to.equal("Log In");
  });

  it("keeps the user logged in when the logout is cancelled", async function () {
    build({ userToken: "a-token", confirm: false });
    const loggedOut = recordTopic(Topics.LOGGEDOUT);
    view.logInOrRegister.fireEvent("click");
    await flush();
    expect(cerdiApi.retrieveUserToken()).to.equal("a-token");
    expect(loggedOut()).to.equal(false);
  });

  it("stops updating the widgets after dispose", function () {
    build({ userToken: null });
    ctl.dispose();
    ctl = null;
    Topics.fireTopicEvent(Topics.LOGGEDIN);
    expect(view.logInLabel.text).to.equal("Log In");
  });
});

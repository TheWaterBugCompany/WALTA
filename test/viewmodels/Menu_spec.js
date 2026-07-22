require("mocha");
const { expect } = require("chai");
const MenuViewModel = require("../../walta-app/app/lib/viewmodels/Menu");
const Palette = require("../../walta-app/app/lib/util/Palette");
const Topics = require("../../walta-app/app/lib/ui/Topics");

describe("MenuViewModel", function () {

  afterEach(function () {
    Topics.reset();
  });

  it("labels the login button Log In when there is no user token", function () {
    const vm = makeViewModel({ userToken: null });
    expect(vm.loginLabel).to.equal("Log In");
  });

  it("labels the login button You are Logged in when a user token is held", function () {
    const vm = makeViewModel({ userToken: "a-token" });
    expect(vm.loginLabel).to.equal("You are Logged in");
  });

  it("shows the bare version number in production", function () {
    const vm = makeViewModel({ environment: "production", version: "2.5.0.0" });
    expect(vm.versionLabel).to.equal("v2.5.0.0");
  });

  it("flags the test server in the version label off production", function () {
    const vm = makeViewModel({ environment: "development", version: "2.5.0.0" });
    expect(vm.versionLabel).to.equal("Test Server v2.5.0.0");
  });

  it("colours the version label as an error off production", function () {
    const vm = makeViewModel({ environment: "development" });
    expect(vm.versionColor).to.equal(Palette.errorDark);
  });

  it("leaves the version label the default colour in production", function () {
    const vm = makeViewModel({ environment: "production" });
    expect(vm.versionColor).to.equal(Palette.primary);
  });

  it("navigates to the sample history when archive is pressed", function () {
    const vm = makeViewModel();
    const fired = recordTopic(Topics.HISTORY);
    vm.history();
    expect(fired()).to.be.true;
  });

  it("navigates to the gallery without the pager when photo gallery is pressed", function () {
    const vm = makeViewModel();
    const fired = recordTopic(Topics.GALLERY);
    vm.gallery();
    expect(fired()).to.deep.equal({ showPager: false });
  });

  it("navigates to the about screen when about is pressed", function () {
    const vm = makeViewModel();
    const fired = recordTopic(Topics.ABOUT);
    vm.about();
    expect(fired()).to.be.true;
  });

  it("starts a detailed survey when the survey button is pressed", function () {
    const vm = makeViewModel();
    const fired = recordTopic(Topics.DETAILED);
    vm.detailed();
    expect(fired()).to.be.true;
  });

  // The training feature it will launch isn't built yet, so the button is
  // owned by the ViewModel like every other but is deliberately inert for now.
  it("does nothing observable when academy is pressed", function () {
    const vm = makeViewModel();
    let anyTopic = false;
    [Topics.HISTORY, Topics.GALLERY, Topics.ABOUT, Topics.DETAILED, Topics.LOGIN]
      .forEach(t => Topics.subscribe(t, () => { anyTopic = true; }));
    let anyEvent = false;
    ["identify", "confirmLogout"].forEach(e => vm.on(e, () => { anyEvent = true; }));

    vm.academy();

    expect(anyTopic, "fired a navigation topic").to.be.false;
    expect(anyEvent, "triggered a view event").to.be.false;
  });

  it("asks the view to offer the identification methods when identify is pressed", function () {
    const vm = makeViewModel();
    let asked = false;
    vm.on("identify", () => { asked = true; });
    vm.identify();
    expect(asked).to.be.true;
  });

  it("goes to the login screen when the login button is pressed logged out", function () {
    const vm = makeViewModel({ userToken: null });
    const fired = recordTopic(Topics.LOGIN);
    vm.loginOrOut();
    expect(fired()).to.be.true;
  });

  it("asks the view to confirm before logging out", function () {
    const vm = makeViewModel({ userToken: "a-token" });
    let asked = false;
    vm.on("confirmLogout", () => { asked = true; });
    vm.loginOrOut();
    expect(asked).to.be.true;
  });

  it("discards the stored token when the logout is confirmed", function () {
    const vm = makeViewModel({ userToken: "a-token" });
    vm.logOut();
    expect(vm.loginLabel).to.equal("Log In");
  });

  it("announces the logout so the rest of the app can react", function () {
    const vm = makeViewModel({ userToken: "a-token" });
    const fired = recordTopic(Topics.LOGGEDOUT);
    vm.logOut();
    expect(fired()).to.be.true;
  });

  it("relabels the login button when the user logs in elsewhere", function () {
    const cerdiApi = fakeCerdiApi(null);
    const vm = makeViewModel({ cerdiApi });
    let notified = false;
    vm.addListener(() => { notified = true; });

    cerdiApi.storeUserToken("a-token");
    Topics.fireTopicEvent(Topics.LOGGEDIN);

    expect(vm.loginLabel).to.equal("You are Logged in");
    expect(notified).to.be.true;
  });

});

// Returns a probe reporting the topic payload, or `true` when it fired
// without one, or `false` when it never fired.
function recordTopic(topic) {
  let fired = false;
  Topics.subscribe(topic, data => { fired = data || true; });
  return () => fired;
}

function makeViewModel({ userToken = null, environment = "production", version = "0.0.0.0", cerdiApi = fakeCerdiApi(userToken) } = {}) {
  return new MenuViewModel({
    cerdiApi,
    topics: Topics,
    environment,
    version,
  });
}

function fakeCerdiApi(userToken) {
  let token = userToken;
  return {
    retrieveUserToken: () => token,
    storeUserToken: newToken => { token = newToken; },
  };
}

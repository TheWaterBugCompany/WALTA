const ChangeNotifier = require("../util/ChangeNotifier");
const Palette = require("../util/Palette");

class MenuViewModel extends ChangeNotifier {
  constructor({ cerdiApi, topics, environment, version }) {
    super();
    this._cerdiApi = cerdiApi;
    this._topics = topics;
    this._environment = environment;
    this._version = version;

    this._onLoggedIn = () => this.notifyListeners();
    topics.subscribe(topics.LOGGEDIN, this._onLoggedIn);
  }

  dispose() {
    this._topics.unsubscribe(this._topics.LOGGEDIN, this._onLoggedIn);
    super.dispose();
  }

  identify() {
    this.trigger("identify");
  }

  loginOrOut() {
    if (this.loggedIn) {
      this.trigger("confirmLogout");
    } else {
      this._topics.fireTopicEvent(this._topics.LOGIN);
    }
  }

  logOut() {
    this._cerdiApi.storeUserToken(null, null);
    this._topics.fireTopicEvent(this._topics.LOGGEDOUT);
    this.notifyListeners();
  }

  detailed() {
    this._topics.fireTopicEvent(this._topics.DETAILED);
  }

  history() {
    this._topics.fireTopicEvent(this._topics.HISTORY);
  }

  gallery() {
    this._topics.fireTopicEvent(this._topics.GALLERY, { showPager: false });
  }

  about() {
    this._topics.fireTopicEvent(this._topics.ABOUT);
  }

  // Placeholder for the training feature — the button is present but inert
  // until Academy is built.
  academy() {
  }

  get isProduction() {
    return this._environment === "production";
  }

  get versionLabel() {
    return this.isProduction ? `v${this._version}` : `Test Server v${this._version}`;
  }

  get versionColor() {
    return this.isProduction ? Palette.primary : Palette.errorDark;
  }

  get loggedIn() {
    return Boolean(this._cerdiApi.retrieveUserToken());
  }

  get loginLabel() {
    return this.loggedIn ? "You are Logged in" : "Log In";
  }
}

module.exports = MenuViewModel;

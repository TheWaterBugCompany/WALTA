const ChangeNotifier = require("../../util/ChangeNotifier");
const Palette = require("../../util/Palette");
const Belts = require("../../logic/Belts");

class MenuViewModel extends ChangeNotifier {
  constructor({ cerdiApi, topics, environment, version, belt }) {
    super();
    this._cerdiApi = cerdiApi;
    this._topics = topics;
    this._environment = environment;
    this._version = version;
    this._belt = belt;

    this._onLoggedIn = () => this.notifyListeners();
    topics.subscribe(topics.LOGGEDIN, this._onLoggedIn);
  }

  dispose() {
    this._topics.unsubscribe(this._topics.LOGGEDIN, this._onLoggedIn);
    super.dispose();
  }

  identify() {
    this._topics.fireTopicEvent(this._topics.SELECT_METHOD, { allowAddToSample: false, surveyType: null });
  }

  // Signed in, the same text opens the account rather than offering to log out:
  // logging out is one of the things the account screen is for.
  loginOrOut() {
    this._topics.fireTopicEvent(this.loggedIn ? this._topics.ACCOUNT : this._topics.LOGIN);
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

  academy() {
    this._topics.fireTopicEvent(this._topics.ACADEMY);
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

  get beltVisible() {
    return Boolean(this._belt);
  }

  get beltColor() {
    return this._belt && this._belt.color;
  }

  get beltTipVisible() {
    return Boolean(this._belt && this._belt.tipColor);
  }

  get beltTipColor() {
    return this._belt && this._belt.tipColor;
  }

  get beltLabel() {
    return Belts.describe(this._belt);
  }
}

module.exports = MenuViewModel;

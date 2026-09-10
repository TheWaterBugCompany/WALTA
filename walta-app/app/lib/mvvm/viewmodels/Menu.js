const ChangeNotifier = require("../../util/ChangeNotifier");
const Palette = require("../../util/Palette");

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

  get beltTipColor() {
    return this._belt && this._belt.tipColor;
  }

  // The belt is outlined so the tip reads as part of it rather than a break in
  // it. A shade of the belt's own colour, so a belt still only has to say what
  // two colours it is made of.
  get beltOutlineColor() {
    return this._belt ? darken(this._belt.color) : null;
  }
}

const OUTLINE_SHADE = 0.9;

function darken(hex) {
  const channels = [1, 3, 5].map((at) =>
    Math.round(parseInt(hex.substr(at, 2), 16) * OUTLINE_SHADE));
  return "#" + channels.map((c) => c.toString(16).padStart(2, "0").toUpperCase()).join("");
}

module.exports = MenuViewModel;

const ChangeNotifier = require("../../util/ChangeNotifier");
const Belts = require("../../logic/Belts");
const BeltViewModel = require("./Belt");

// Three to a row, and short enough that the whole ladder fits down the grid
// without it having to scroll.
const BELT_WIDTH = "29%";
const BELT_HEIGHT = "16%";
const BELT_GAP_ACROSS = "2%";
const BELT_GAP_DOWN = "5%";

// State for the Account Details screen: who the trainee is signed in as, and
// every belt they have earned. Titanium-free.
class AccountViewModel extends ChangeNotifier {
  constructor({ cerdiApi, topics, level = 0 }) {
    super();
    this._cerdiApi = cerdiApi;
    this._topics = topics;
    // The email is held here already, so the screen can name the account before
    // the server is asked anything — and still names it when the server can't
    // be reached at all.
    this._email = cerdiApi.retrieveUsername() || "";
    this._name = "";
    this._belts = beltsUpTo(level);
  }

  // The account's full name only exists on the server. A screen that cannot
  // reach it still shows the account it is signed in to, minus the name.
  load() {
    return this._cerdiApi.retrieveUser().then((user) => {
      if (!user) return;
      this._name = user.name || "";
      this._email = user.email || this._email;
      this.notifyListeners();
    }, () => {});
  }

  get email() { return this._email; }

  get name() { return this._name; }

  get belts() { return this._belts; }

  // A heading with nothing under it reads as a screen that failed to load, not
  // as a score of zero. The note stands in for the grid until the first belt
  // is earned, and says where belts come from while it is there.
  get noBeltsVisible() { return this._belts.length === 0; }

  // Empty rather than held behind a hidden label: a Label keeps the height of
  // whatever text it holds even when it is told to take up none, so the text has
  // to go for the band above the grid to go with it.
  get noBeltsMessage() {
    return this.noBeltsVisible ? "No belts earned yet. Complete academy courses to earn belts." : "";
  }

  // Logging out is worth a second thought, so the view asks; the account is
  // only given up once it comes back confirmed.
  logOut() { this.trigger("confirmLogOut"); }

  completeLogOut() {
    this._cerdiApi.storeUserToken(null, null);
    this._topics.fireTopicEvent(this._topics.LOGGEDOUT);
    this._topics.fireTopicEvent(this._topics.HOME);
  }

  // Deleting an account cannot be undone, so the modal asks for the password
  // before anything is destroyed.
  deleteAccount() {
    this._topics.fireTopicEvent(this._topics.DELETE_ACCOUNT);
  }
}

function beltsUpTo(level) {
  const belts = [];
  for (let at = 1; at <= level && at <= Belts.HIGHEST; at++) {
    belts.push(new BeltViewModel(Belts.at(at), {
      level: at, width: BELT_WIDTH, height: BELT_HEIGHT,
      left: BELT_GAP_ACROSS, top: BELT_GAP_DOWN,
    }));
  }
  return belts;
}

module.exports = AccountViewModel;

const ChangeNotifier = require("../../util/ChangeNotifier");
const Palette = require("../../util/Palette");

// State for the Delete Account modal. Deleting an account cannot be undone, so
// the password is proved against the server before anything is destroyed — a
// mistyped one then costs nothing. Titanium-free.
class DeleteAccountViewModel extends ChangeNotifier {
  constructor({ cerdiApi, topics }) {
    super();
    this._cerdiApi = cerdiApi;
    this._topics = topics;
    this._password = "";
  }

  get password() { return this._password; }

  set password(value) {
    const next = value == null ? "" : String(value);
    if (next === this._password) return;
    this._password = next;
    this.notifyListeners();
  }

  get deleteEnabled() { return this._password.length > 0; }

  // How ready the button is has to be readable in its colours, and the platforms
  // do not agree on a stylesheet's account of that: iOS ignores
  // backgroundDisabledColor, and Android honours it for the body while keeping
  // the red outline over the grey. So the state says what colour it is.
  get deleteColor() { return this.deleteEnabled ? Palette.error : Palette.disabled; }

  get deleteOutlineColor() { return this.deleteEnabled ? Palette.failure : Palette.disabled; }

  confirmDelete() {
    if (!this.deleteEnabled) return Promise.resolve();
    return this._cerdiApi.loginUser(this._cerdiApi.retrieveUsername(), this._password)
      .then(
        () => this._cerdiApi.deleteUser().then(
          () => this._accountIsGone(),
          () => this.trigger("deleteFailed")),
        () => this.trigger("passwordIncorrect"));
  }

  // The account no longer exists, so the app cannot stay signed in to it.
  // The modal goes first and the navigation follows: going home while this is
  // still up leaves it closing over a window that has already been torn down.
  _accountIsGone() {
    this.trigger("close");
    this._cerdiApi.storeUserToken(null, null);
    this._topics.fireTopicEvent(this._topics.LOGGEDOUT);
    this._topics.fireTopicEvent(this._topics.HOME);
  }

  close() { this.trigger("close"); }
}

module.exports = DeleteAccountViewModel;

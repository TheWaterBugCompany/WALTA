const ChangeNotifier = require("../../util/ChangeNotifier");

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
  _accountIsGone() {
    this._cerdiApi.storeUserToken(null, null);
    this._topics.fireTopicEvent(this._topics.LOGGEDOUT);
    this._topics.fireTopicEvent(this._topics.HOME);
    this.trigger("close");
  }

  close() { this.trigger("close"); }
}

module.exports = DeleteAccountViewModel;

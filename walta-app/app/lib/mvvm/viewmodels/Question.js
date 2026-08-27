const ChangeNotifier = require("../../util/ChangeNotifier");

// One branch of a couplet: the text and photo the reader chooses between, and
// the verdict a hint puts on it ("correct" / "incorrect", or null when this
// couplet carries no hint). Titanium-free.
class QuestionViewModel extends ChangeNotifier {
  constructor({ key, question, verdict = null, onSelect }) {
    super();
    this._key = key;
    this._question = question;
    this._verdict = verdict;
    this._onSelect = onSelect;
  }

  get key() { return this._key; }
  get text() { return this._question.text.trim(); }
  get photoUrls() { return this._question.photoUrls; }
  get hasPhoto() { return this._question.photoUrls.length > 0; }
  get verdict() { return this._verdict; }

  select() { this._onSelect(); }
}

module.exports = QuestionViewModel;

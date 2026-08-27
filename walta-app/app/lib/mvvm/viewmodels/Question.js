const ChangeNotifier = require("../../util/ChangeNotifier");
const Palette = require("../../util/Palette");

// Wide enough to read as an outline around the whole branch rather than a hairline
// on its edge — the hint is meant to be seen at a glance. It carries its unit
// because ti.ui.defaultunit is "system", which means points on iOS but raw pixels
// on Android — a bare number drew this three times thinner there.
const VERDICT_BORDER = "8dp";

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

  // A branch with no photo hands the panel's share of the row back to its text,
  // rather than leaving a gap where the photo would have been.
  get photoVisible() { return this.hasPhoto; }
  get photoWidth() { return this.hasPhoto ? "35%" : "0%"; }
  get textWidth() { return this.hasPhoto ? "58%" : "88%"; }
  get verdict() { return this._verdict; }

  // The same tick/cross vocabulary the training tray marks its slots with.
  get verdictImage() {
    if (this._verdict === "correct") { return "/images/tick-icon.png"; }
    if (this._verdict === "incorrect") { return "/images/cross-icon.png"; }
    return null;
  }

  get verdictVisible() { return this.verdictImage !== null; }

  get borderColor() {
    if (this._verdict === "correct") { return Palette.success; }
    if (this._verdict === "incorrect") { return Palette.failure; }
    // Titanium paints a hairline for a colour set at zero width, so an unhinted
    // branch needs no colour rather than a hidden one.
    return "transparent";
  }

  get borderWidth() { return this._verdict ? VERDICT_BORDER : 0; }

  // The tick/cross sits beside the card rather than over it, so a hinted branch
  // gives up a gutter for it — an unhinted one keeps the full width it always had.
  get cardLeft() { return this._verdict ? "7%" : "0%"; }

  select() { this._onSelect(); }
}

module.exports = QuestionViewModel;

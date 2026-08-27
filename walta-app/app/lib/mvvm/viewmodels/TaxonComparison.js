const ChangeNotifier = require("../../util/ChangeNotifier");
const TaxonComparisonPhotoViewModel = require("./TaxonComparisonPhoto");

// Feedback on one identification made during a training assessment: what was
// chosen, what it should have been, and the photos side by side when they differ.
// Titanium-free.
//
// It reports the "which question did I get wrong?" request rather than acting on
// it — walking the reader back to the couplet they went astray at is the caller's
// job, so this screen stays usable from anywhere that can assess an answer.
class TaxonComparisonViewModel extends ChangeNotifier {
  constructor({ key, topics, selectedTaxonId, correctTaxonId }) {
    super();
    this._key = key;
    this._topics = topics;
    this._selectedTaxonId = selectedTaxonId;
    this._correctTaxonId = correctTaxonId;
    // Built once: bindView re-reads a collection getter on every change, and
    // rebuilding these would remount the photos for nothing.
    this._cards = this._taxonIds().map((id) => this._card(id));
  }

  get isCorrect() { return this._selectedTaxonId === this._correctTaxonId; }

  get message() {
    const correct = this._nameOf(this._correctTaxonId);
    if (this.isCorrect) { return `You correctly identified this taxon: ${correct}.`; }
    return `You incorrectly identified this taxon as ${this._nameOf(this._selectedTaxonId)}`
      + ` but it should have been ${correct}.`;
  }

  _nameOf(taxonId) { return this._key.findTaxonById(taxonId).name; }

  get cards() { return this._cards; }

  // The same tick/cross vocabulary the training tray and the key hints use.
  get verdictImage() {
    return this.isCorrect ? "/images/tick-icon.png" : "/images/cross-icon.png";
  }

  // A wrong answer has somewhere to go next, so the follow-up replaces the plain
  // dismissal rather than sitting beside it — the ✕ is still there to just leave.
  get showsWhichQuestion() { return !this.isCorrect; }

  // One action, not two: a hidden Titanium view still takes up its space in a
  // vertical layout, so a second button left a hole under the photos.
  get actionLabel() {
    return this.isCorrect ? "Close" : "Which question did I get wrong?";
  }

  activate() {
    if (this.isCorrect) { this.close(); } else { this.whichQuestion(); }
  }

  whichQuestion() { this.trigger("which-question"); }

  close() { this.trigger("close"); }

  // One taxon when the answer was right, two to compare when it wasn't — the
  // chosen one first, since that is the one the reader is looking for.
  _taxonIds() {
    return this.isCorrect
      ? [this._correctTaxonId]
      : [this._selectedTaxonId, this._correctTaxonId];
  }

  _card(taxonId) {
    const taxon = this._key.findTaxonById(taxonId);
    return new TaxonComparisonPhotoViewModel({
      key: taxonId,
      name: taxon.name,
      photoUrl: taxon.photoUrls.length > 0 ? taxon.photoUrls[0] : null,
      // Feedback on an assessment, not a step in an identification — so browsing
      // out to a taxon from here must not offer to add it to the sample.
      onOpen: () => this._topics.fireTopicEvent(this._topics.JUMPTO, { id: taxonId, allowAddToSample: false }),
    });
  }
}

module.exports = TaxonComparisonViewModel;

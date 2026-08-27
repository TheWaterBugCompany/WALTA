const ChangeNotifier = require("../../util/ChangeNotifier");

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
  }

  get isCorrect() { return this._selectedTaxonId === this._correctTaxonId; }

  get message() {
    const correct = this._display(this._correctTaxonId);
    if (this.isCorrect) { return `You correctly identified this taxon: ${correct.name}.`; }
    const chosen = this._display(this._selectedTaxonId);
    return `You incorrectly identified this taxon as ${chosen.name} but it should have been ${correct.name}.`;
  }

  // One taxon when the answer was right, two to compare when it wasn't — the
  // chosen one first, since that is the one the reader is looking for.
  get taxa() {
    return this.isCorrect
      ? [this._display(this._correctTaxonId)]
      : [this._display(this._selectedTaxonId), this._display(this._correctTaxonId)];
  }

  get showsWhichQuestion() { return !this.isCorrect; }

  whichQuestion() { this.trigger("which-question"); }

  close() { this.trigger("close"); }

  // Feedback on an assessment, not a step in an identification — so browsing out
  // to a taxon from here must not offer to add it to the sample.
  openTaxon(taxonId) {
    this._topics.fireTopicEvent(this._topics.JUMPTO, { id: taxonId, allowAddToSample: false });
  }

  _display(taxonId) {
    const taxon = this._key.findTaxonById(taxonId);
    return {
      taxonId: taxonId,
      name: taxon.name,
      photoUrl: taxon.photoUrls.length > 0 ? taxon.photoUrls[0] : null,
    };
  }
}

module.exports = TaxonComparisonViewModel;

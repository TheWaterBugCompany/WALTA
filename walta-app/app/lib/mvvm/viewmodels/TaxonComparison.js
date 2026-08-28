const ChangeNotifier = require("../../util/ChangeNotifier");
const TaxonComparisonPhotoViewModel = require("./TaxonComparisonPhoto");

// Feedback on one identification made during a training assessment: what was
// chosen, what it should have been, and the photos side by side when they differ.
// Titanium-free.
class TaxonComparisonViewModel extends ChangeNotifier {
  constructor({ key, topics, selectedTaxonId, correctTaxonId, position = null }) {
    super();
    this._key = key;
    this._topics = topics;
    this._selectedTaxonId = selectedTaxonId;
    this._correctTaxonId = correctTaxonId;
    this._position = position;
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

  // A hint is found by the taxon's place in the key, not by its taxonId — the
  // two are separate id spaces and the wrong one silently finds nothing.
  _refOf(taxonId) { return this._key.findTaxonById(taxonId).id; }

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

  // Back to the couplet the two taxa part at, with the branch that should have
  // been taken marked. The tray position rides along so a corrected
  // identification lands back in the slot it was graded in.
  whichQuestion() {
    const hint = this._key.hintForIncorrectDecision(this._refOf(this._selectedTaxonId), this._refOf(this._correctTaxonId));
    this.close();
    this._topics.fireTopicEvent(this._topics.JUMPTO, {
      id: hint.nodeId,
      hint,
      allowAddToSample: true,
      position: this._position,
      training: true,
    });
  }

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

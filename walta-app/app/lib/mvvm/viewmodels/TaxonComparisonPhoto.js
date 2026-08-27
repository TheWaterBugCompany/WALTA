const ChangeNotifier = require("../../util/ChangeNotifier");

// One taxon shown on the comparison screen: its photo, its name across the
// bottom, and the tap that browses out to it. Titanium-free.
//
// A card owns the browse intent rather than the screen wiring each one up, the
// same way a tray cell owns its own tap.
class TaxonComparisonPhotoViewModel extends ChangeNotifier {
  constructor({ key, name, photoUrl, onOpen }) {
    super();
    this._key = key;
    this._name = name;
    this._photoUrl = photoUrl;
    this._onOpen = onOpen;
  }

  // bindView's collection diff identifies a child by this; two cards sharing a
  // key are read as one child and only one is ever mounted.
  get key() { return this._key; }

  get name() { return this._name; }
  get photoUrl() { return this._photoUrl; }

  // A taxon can have no photo at all; the card then shows its name and no image
  // rather than an empty frame.
  get hasPhoto() { return this._photoUrl !== null; }

  open() { this._onOpen(); }
}

module.exports = TaxonComparisonPhotoViewModel;

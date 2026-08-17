const ChangeNotifier = require("../../util/ChangeNotifier");
const MenuEntryViewModel = require("./MenuEntry");

// State for the MethodSelect modal: the identification methods the caller may
// pick, as a collection of MenuEntry row-VMs the view binds. In training mode
// only the Key is offered — the rest are disabled (greyed) and route nowhere.
// Titanium-free.
class MethodSelectViewModel extends ChangeNotifier {
  constructor({ topics, training = false, allowAddToSample = false, surveyType = null, unknownBug = false, position = null }) {
    super();
    this._topics = topics;
    // position rides through to the key so a re-identification lands back in the
    // same tray slot; null for a fresh identification (which appends). training
    // rides through so the eventual identification routes to the training tray.
    const payload = { allowAddToSample, surveyType, position, training };

    // Cards share the modal height: three at 30.67%, or four (with the unknown
    // bug) at 25% plus a shorter 16% unknown-bug card.
    const mainSize = unknownBug ? "25%" : "30.67%";

    this._entries = [];
    this._addEntry("keysearch", "/images/key-icon.png", "Key",
      "Questions to help identify your waterbug.", false, mainSize,
      () => this._route(topics.KEYSEARCH, payload));
    this._addEntry("speedbug", "/images/icon-speedbug.png", "Speedbug",
      "Look at silhouettes of waterbugs to choose the best match.", training, mainSize,
      () => this._route(topics.SPEEDBUG, payload));
    this._addEntry("browselist", "/images/browse-icon.png", "Browse",
      "If you know the name or scientific name of your waterbug.", training, mainSize,
      () => this._route(topics.BROWSE, payload));
    if (unknownBug) {
      this._addEntry("unknownbug", "/images/unknown-bug-icon.png", "Unknown bug",
        "If you can't identify the bug.", training, "16%",
        () => this._route(topics.IDENTIFY, { taxonId: null, training }));
    }
  }

  get entries() { return this._entries; }

  close() { this.trigger("close"); }

  _addEntry(key, icon, title, description, disabled, size, onSelect) {
    this._entries.push(new MenuEntryViewModel({ key, icon, title, description, disabled, size, onSelect }));
  }

  _route(topic, data) {
    this.trigger("close");
    this._topics.fireTopicEvent(topic, data);
  }
}

module.exports = MethodSelectViewModel;

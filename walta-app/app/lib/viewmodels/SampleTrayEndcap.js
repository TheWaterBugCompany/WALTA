const SampleTrayCellViewModel = require("./SampleTrayCell");

const ENDCAP_BACKGROUND = "/images/endcap_320.png";

// The fixed left endcap: the first two cells, at the tray origin. Bound as a single
// component (not a collection) — there is always exactly one.
class SampleTrayEndcapViewModel extends SampleTrayCellViewModel {
  constructor(tray) {
    super(tray, [0, 1]);
  }
  get key() { return "endcap"; }
  get left() { return 0; }
  get width() { return this._tray.endcapWidth; }
  get backgroundImage() { return ENDCAP_BACKGROUND; }
}

module.exports = SampleTrayEndcapViewModel;

// Screens (windows and modals) with a Titanium-free lib/mvvm/controllers/<name>
// screen controller that View instantiates to drive the binding. Absent names
// open with no screen controller. See docs/patterns/modals.md.
module.exports = {
  Academy: require("./Academy"),
  Menu: require("./Menu"),
  MethodSelect: require("./MethodSelect"),
  SampleHistory: require("./SampleHistory"),
  SampleHistoryRow: require("./SampleHistoryRow"),
  SampleTaxaIcon: require("./SampleTaxaIcon"),
  SampleTray: require("./SampleTray"),
  SampleTrayTile: require("./SampleTrayTile"),
  SampleTrayEndcap: require("./SampleTrayEndcap"),
  SampleEditMenu: require("./SampleEditMenu"),
  SyncFeedback: require("./SyncFeedback"),
};

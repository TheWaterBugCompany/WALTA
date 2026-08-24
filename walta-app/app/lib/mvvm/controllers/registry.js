// Screens (windows and modals) with a Titanium-free lib/mvvm/controllers/<name>
// screen controller that View instantiates to drive the binding. Absent names
// open with no screen controller. See docs/patterns/modals.md.
module.exports = {
  Academy: require("./Academy"),
  Menu: require("./Menu"),
  MenuButton: require("./MenuButton"),
  MethodSelect: require("./MethodSelect"),
  SampleHistory: require("./SampleHistory"),
  SampleHistoryRow: require("./SampleHistoryRow"),
  SampleTaxaIcon: require("./SampleTaxaIcon"),
  SampleTrayPlus: require("./SampleTrayPlus"),
  SampleTray: require("./SampleTray"),
  SampleTrayTile: require("./SampleTrayTile"),
  SampleEditMenu: require("./SampleEditMenu"),
  TrainingSuccess: require("./TrainingSuccess"),
  TrainingTray: require("./TrainingTray"),
  SyncFeedback: require("./SyncFeedback"),
};

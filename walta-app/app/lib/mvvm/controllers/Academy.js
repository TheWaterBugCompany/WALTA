const AcademyViewModel = require("mvvm/viewmodels/Academy");
// Markers only — the binder itself is injected (pre-bound by the View seam);
// these are needed here at module scope to build BINDINGS.
const { component, present } = require("util/bindView");

// Titanium-free screen controller for the Academy modal.
// See docs/patterns/modals.md for the pattern.
const BINDINGS = {
  currentMessage:  { text: "currentMessage" },
  currentBelt:     { belt: component("currentBeltVm", "Belt") },
  // present, not visible: a hidden view keeps its band in a vertical layout, so
  // a refresh — which has no belt on offer — would open with a hole in it.
  nextMessage:     { text: "nextMessage", visible: present("nextVisible") },
  nextBelt:        { visible: present("nextVisible"), belt: component("nextBeltVm", "Belt") },
  refreshGapAbove: { visible: present("isRefresh") },
  refreshGapBelow: { visible: present("isRefresh") },
  introMessage:    { text: "introMessage" },
  startButton:     { title: "actionLabel", enabled: "actionEnabled", backgroundColor: "actionColor", borderColor: "actionColor", onClick: "start" },
  closeButton:     { onClose: "close" },   // the ✕ (CloseButton Require)
  cancelButton:    { onClick: "close" },   // the "Close" text button
};

module.exports = function createAcademyController({ view, args, close, services, bindView }) {
  const vm = new AcademyViewModel({
    level: services.belts ? services.belts.currentLevel() : 0,
    // Set when the trainee tapped a belt they already hold: this modal then
    // offers that course again rather than the one above it.
    refreshing: (args && args.refreshing) != null ? args.refreshing : null,
    isValidCode: (code) => services.Training.isValidCode(code),
  });
  const unbind = bindView(view, vm, BINDINGS);

  vm.on("start", function (code) {
    // A refresh always opens an empty tray; the ordinary climb picks up an
    // unfinished attempt where it was left.
    const opened = vm.isRefresh
      ? services.Training.restartTraining(code)
      : services.Training.startTraining(code);
    if (opened) {
      close();
      services.topics.fireTopicEvent(services.topics.TRAININGTRAY);
    }
  });
  vm.on("close", function () { close(); });

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};

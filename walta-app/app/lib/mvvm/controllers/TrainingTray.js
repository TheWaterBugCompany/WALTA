const TrainingTrayViewModel = require("mvvm/viewmodels/TrainingTray");
const TrainingTraySource = require("logic/TrainingTraySource");
const TrainingAssessor = require("logic/TrainingAssessor");

// Titanium-free screen controller for the training ice-cube tray. Declares the
// whole screen through bindView, same shape as its survey peer
// (lib/mvvm/controllers/SampleTray.js) plus the "some incorrect" notice — that
// chrome is training-only. See docs/patterns/screen-controllers.md.
//
// Training is always editable — an isolated part of the database, not a
// historical record being viewed — so no readonly is threaded into the source.
module.exports = function createTrainingTray({ view, args, services, bindView }) {
  const { collection, component, input, measure, command, ref } = bindView;
  const platform = services.platform;

  const source = TrainingTraySource(args.tray, args.key);
  const vm = new TrainingTrayViewModel({
    taxaSource: source,
    topics: services.topics,
    toDip: platform.convertSystemToDip,
    toSystem: platform.convertDipToSystem,
    assessor: args.assessor || services.assessor || TrainingAssessor(),
    noticeDwellMs: args.noticeDwellMs,
  });

  // A clean training run opens the success modal — the VM announces it; the
  // screen translates that into the navigation intent (Main routes it to the modal).
  vm.on("allCorrect", (correctCount) =>
    services.topics.fireTopicEvent(services.topics.TRAINING_SUCCESS, { correctCount }));

  const unbind = bindView(view, vm, {
    tray: {
      width: "trayWidthCss",
      endcap: component("endcapVm", "SampleTrayTile"),
      tiles: collection("visibleTiles", "SampleTrayTile"),
    },
    content: {
      onPostlayout: measure("setViewport", "size"),
      onScroll: input("setScrollOffset", "contentOffset.x"),
      snapRight: command("scrollToRightEnd", "scrollTo", ref("scrollTargetX"), 0, { animate: true }),
    },
    // The "some incorrect" notice: visibility + text are bound; the fade in/out is
    // a pair of commands the VM fires around its dwell (Ti animation stays behind
    // bindView, no Alloy-shell logic).
    incorrectNotice: {
      visible: "noticeVisible",
      fadeIn: command("fadeInNotice", "animate", { opacity: 1, duration: 200 }),
      fadeOut: command("fadeOutNotice", "animate", { opacity: 0, duration: 400 }),
    },
    incorrectNoticeLabel: { text: "noticeText" },
  });

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};

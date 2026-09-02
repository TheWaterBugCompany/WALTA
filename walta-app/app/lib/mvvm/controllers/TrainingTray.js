const TrainingTrayViewModel = require("mvvm/viewmodels/TrainingTray");
const TrainingTraySource = require("logic/TrainingTraySource");
const TrainingAssessor = require("logic/TrainingAssessor");

module.exports = function createTrainingTray({ view, args, services, bindView }) {
  const { collection, component, input, measure, command, deferredCommand, ref } = bindView;
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

  vm.on("allCorrect", (correctCount) =>
    services.topics.fireTopicEvent(services.topics.TRAINING_SUCCESS, { correctCount }));

  const unbind = bindView(view, vm, {
    tray: {
      width: "trayWidthCss",
      // Titanium widens the tray a layout pass after the model asks it to; the
      // width it reports back is what the reveal can actually scroll to.
      onPostlayout: measure("setTrayWidth", "size"),
      endcap: component("endcapVm", "SampleTrayTile"),
      tiles: collection("visibleTiles", "SampleTrayTile"),
    },
    content: {
      onPostlayout: measure("setViewport", "size"),
      onScroll: input("setScrollOffset", "contentOffset.x"),
      // Deferred: Titanium ignores a scroll asked for in the same turn as the
      // layout that widened the tray, and then reports the offset it was asked
      // for as though it had moved.
      snapRight: deferredCommand("scrollToRightEnd", "scrollTo", ref("scrollTargetX"), 0, { animate: false }),
    },
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

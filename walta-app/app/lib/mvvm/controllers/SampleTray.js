const SampleTrayViewModel = require("mvvm/viewmodels/SampleTray");
const SampleTraySource = require("logic/SampleTraySource");
const TrainingTraySource = require("logic/TrainingTraySource");
const TrainingAssessor = require("logic/TrainingAssessor");

// Titanium-free screen controller for the ice-cube SampleTray. Declares the whole
// screen through bindView: the tray width, the single fixed endcap component + the
// windowed interior tiles collection, and — via the inbound/command bindings — the
// viewport measurement, the scroll offset and the scroll-to-right animation. The
// residual Alloy shell holds no view-model and no wiring; unit conversion lives in
// the VM behind the injected platform converters. See
// docs/patterns/screen-controllers.md.
module.exports = function createSampleTray({ view, args, services, bindView }) {
  const { collection, component, input, measure, command, ref } = bindView;
  const platform = services.platform;

  // A training session threads its SampleTray domain aggregate as args.tray; a
  // survey threads its Alloy taxa collection as args.taxa. The assessor rides in
  // on args from the training session (via Navigation), falling back to the
  // services bag and then an empty assessor for the survey path.
  const source = args.tray
    ? TrainingTraySource(args.tray, args.key, args.readonly === true)
    : SampleTraySource(args.taxa, args.key, args.readonly === true, args.sample);
  const vm = new SampleTrayViewModel({
    taxaSource: source,
    topics: services.topics,
    toDip: platform.convertSystemToDip,
    toSystem: platform.convertDipToSystem,
    training: args.training === true,
    assessor: args.assessor || services.assessor || TrainingAssessor(),
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
      // Inbound Titanium: the one-shot viewport measurement and the scroll offset
      // feed the VM; the scroll-to-right command animates the ScrollView when asked.
      onPostlayout: measure("setViewport", "size"),
      onScroll: input("setScrollOffset", "contentOffset.x"),
      snapRight: command("scrollToRightEnd", "scrollTo", ref("scrollTargetX"), 0, { animate: true }),
    },
  });

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};

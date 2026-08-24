const SampleTrayViewModel = require("mvvm/viewmodels/SampleTray");
const SampleTraySource = require("logic/SampleTraySource");

// Titanium-free screen controller for the survey ice-cube SampleTray. Declares
// the whole screen through bindView: the tray width, the single fixed endcap
// component + the windowed interior tiles collection, and — via the inbound/
// command bindings — the viewport measurement, the scroll offset and the
// scroll-to-right animation. The residual Alloy shell holds no view-model and
// no wiring; unit conversion lives in the VM behind the injected platform
// converters. See docs/patterns/screen-controllers.md.
//
// Training's peer screen is lib/mvvm/controllers/TrainingTray.js — a separate
// screen built on TrainingTrayViewModel, not a branch of this one.
module.exports = function createSampleTray({ view, args, services, bindView }) {
  const { collection, component, input, measure, command, ref } = bindView;
  const platform = services.platform;

  const source = SampleTraySource(args.taxa, args.key, args.readonly === true, args.sample);
  const vm = new SampleTrayViewModel({
    taxaSource: source,
    topics: services.topics,
    toDip: platform.convertSystemToDip,
    toSystem: platform.convertDipToSystem,
  });

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

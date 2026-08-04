const SampleTrayViewModel = require("viewmodels/SampleTray");
const SampleTraySource = require("logic/SampleTraySource");

// Titanium-free screen controller for the ice-cube SampleTray. Declares the whole
// screen through bindView: the tray width, the single fixed endcap component + the
// windowed interior tiles collection, and — via the inbound/command bindings — the
// Titanium scroll offset and scroll-to-right animation. The one Titanium layout
// hack (measuring the ScrollView around a premature postlayout) is a shell
// capability the controller drives, not a binding. The residual Alloy shell holds
// no view-model and no wiring; unit conversion lives in the VM behind the injected
// platform converters. See docs/patterns/screen-controllers.md.
module.exports = function createSampleTray({ view, args, services, bindView }) {
  const { collection, component, input, command, ref } = bindView;
  const platform = services.platform;

  const source = SampleTraySource(Alloy.Collections["taxa"], args.key, args.readonly === true);
  const vm = new SampleTrayViewModel({
    taxaSource: source,
    topics: services.topics,
    toDip: platform.convertSystemToDip,
    toSystem: platform.convertDipToSystem,
  });

  const unbind = bindView(view, vm, {
    tray: {
      width: "trayWidthCss",
      endcap: component("endcapVm", "SampleTrayEndcap"),
      tiles: collection("visibleTiles", "SampleTrayTile"),
    },
    content: {
      // Inbound Titanium: the scroll offset feeds the VM; the scroll-to-right
      // command animates the ScrollView when the VM asks.
      onScroll: input("setScrollOffset", "contentOffset.x"),
      snapRight: command("scrollToRightEnd", "scrollTo", ref("scrollTargetX"), 0, { animate: true }),
    },
  });

  // The viewport size is the one Titanium layout hack the shell owns (see its
  // measureViewport); the VM just receives a clean size and re-derives geometry.
  const stopMeasure = view.measureViewport(size => vm.setViewport(size));

  return {
    vm,
    dispose() {
      stopMeasure();
      unbind();
      vm.dispose();
    },
  };
};

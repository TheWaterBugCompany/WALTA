const SampleTrayViewModel = require("viewmodels/SampleTray");
const SampleTraySource = require("logic/SampleTraySource");

// Titanium-free screen controller for the ice-cube SampleTray. Declares the whole
// screen through bindView: the tray width, the fixed endcap + windowed interior
// tiles as convention collections, and — via the inbound/command bindings — the
// Titanium scroll offset, viewport measurement and scroll-to-right animation. The
// residual Alloy shell holds no view-model and no wiring. Unit conversion lives in
// the VM behind the injected platform converters. See
// docs/patterns/screen-controllers.md.
module.exports = function createSampleTray({ view, args, services, bindView }) {
  const { collection, input, measure, command, ref } = bindView;
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
      endcap: collection("endcapTiles", "SampleTrayEndcap"),
      tiles: collection("visibleTiles", "SampleTrayTile"),
    },
    content: {
      // Inbound Titanium: the scroll offset and one-shot viewport measurement feed
      // the VM; the scroll-to-right command animates the ScrollView when the VM asks.
      onScroll: input("setScrollOffset", "contentOffset.x"),
      onPostlayout: measure("setViewport", "size"),
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

const SampleTrayViewModel = require("mvvm/viewmodels/SampleTray");
const SampleTraySource = require("logic/SampleTraySource");

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
      // Titanium widens the tray a layout pass after the model asks it to; the
      // width it reports back is what the reveal can actually scroll to.
      onPostlayout: measure("setTrayWidth", "size"),
      endcap: component("endcapVm", "SampleTrayTile"),
      tiles: collection("visibleTiles", "SampleTrayTile"),
    },
    content: {
      // Inbound Titanium: the one-shot viewport measurement and the scroll offset
      // feed the VM; the scroll-to-right command animates the ScrollView when asked.
      onPostlayout: measure("setViewport", "size"),
      onScroll: input("setScrollOffset", "contentOffset.x"),
      snapRight: command("scrollToRightEnd", "scrollTo", ref("scrollTargetX"), 0, { animate: false }),
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

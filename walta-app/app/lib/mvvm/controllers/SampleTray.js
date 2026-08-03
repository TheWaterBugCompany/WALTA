const SampleTrayViewModel = require("viewmodels/SampleTray");

// Titanium-free screen controller for the ice-cube SampleTray. Declares the
// tray as two convention collections — the fixed endcap and the windowed
// interior tiles — plus the tray width; the injected bindView owns the keyed
// diff and each cell owns its own geometry + taps. The residual Alloy shell
// drives the Ti-side scroll/viewport measurement into the VM. No escape hatch:
// the shell's scroll listener feeds vm.setScrollOffset (Ti), which notifies so
// the collection reconciles. See docs/patterns/screen-controllers.md.
module.exports = function createSampleTray({ view, bindView }) {
  const { collection } = bindView;
  const vm = new SampleTrayViewModel({ taxaSource: view.getTaxaSource() });

  const unbind = bindView(view, vm, {
    tray: {
      width: "trayWidthCss",
      endcap: collection("endcapTiles", "SampleTrayEndcap"),
      tiles: collection("visibleTiles", "SampleTrayTile"),
    },
  });

  // Hand the VM to the shell so its Titanium listeners (postlayout, scroll, taxa
  // add/change/remove, scrollToRightEdge) drive the pure windowing.
  view.attachViewModel(vm);

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};

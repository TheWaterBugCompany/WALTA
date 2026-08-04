// Titanium-free tray-cell (slot) component for a taxon (or blank) cell. Binds its
// SampleTaxaIconViewModel — the silhouette + abundance for a taxon — onto the
// widgets and routes the single tap surface to the cell's own tap() intent. The
// add affordance is a separate component (SampleTrayPlus); the polymorphic tray
// collection swaps between the two by kind, so this one never knows about the plus.
// The VM owns the intent (IDENTIFY), so the tray needs no per-cell wiring; mirrors
// SampleHistoryRow. See docs/patterns/screen-controllers.md.
const BINDINGS = {
  SampleTaxaIcon: { width: "widthCss" },
  padIcon:        { visible: "iconVisible" },
  icon:           { image: "image" },
  abundance:      { text: "abundanceText", visible: "abundanceVisible" },
  tap:            { accessibilityLabel: "accessibilityLabel", onClick: "tap" },
};

module.exports = function createSampleTaxaIcon({ view, args, bindView }) {
  const unbind = bindView(view, args.rowVm, BINDINGS);
  return { dispose: unbind };
};

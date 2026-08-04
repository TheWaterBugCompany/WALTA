// Titanium-free first-class tray-cell (slot) component. Binds its
// SampleTaxaIconViewModel — the silhouette / abundance for a taxon, the plus
// background for an add cell — onto the widgets, and routes the single tap
// surface to the cell's own tap() intent. The VM owns the intent (IDENTIFY /
// SELECT_METHOD), so the tray needs no per-cell wiring; mirrors SampleHistoryRow.
// See docs/patterns/screen-controllers.md.
const BINDINGS = {
  SampleTaxaIcon: { width: "widthCss" },
  padIcon:        { visible: "iconVisible" },
  icon:           { image: "image" },
  abundance:      { text: "abundanceText", visible: "abundanceVisible" },
  plus:           { image: "plusImage", visible: "plusVisible" },
  tap:            { accessibilityLabel: "accessibilityLabel", onClick: "tap" },
};

module.exports = function createSampleTaxaIcon({ view, args, bindView }) {
  const unbind = bindView(view, args.rowVm, BINDINGS);
  return { dispose: unbind };
};

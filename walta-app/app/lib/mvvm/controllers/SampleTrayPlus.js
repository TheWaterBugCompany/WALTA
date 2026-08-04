// Titanium-free tray-cell (slot) component for the "add to sample" affordance.
// Binds its SampleTrayPlusViewModel — the plus icon (shown on the plus cell, hidden
// on invisible add-behind cells) — and routes the single tap surface to the cell's
// own add intent. The polymorphic sibling is SampleTaxaIcon (a taxon/blank cell);
// the tray's collection swaps between them by kind. The VM owns the intent
// (SELECT_METHOD), so the tray needs no per-cell wiring; mirrors SampleHistoryRow.
// See docs/patterns/screen-controllers.md.
const BINDINGS = {
  SampleTrayPlus: { width: "widthCss" },
  plus:           { image: "plusImage", visible: "plusVisible" },
  tap:            { accessibilityLabel: "accessibilityLabel", onClick: "tap" },
};

module.exports = function createSampleTrayPlus({ view, args, bindView }) {
  const unbind = bindView(view, args.rowVm, BINDINGS);
  return { dispose: unbind };
};

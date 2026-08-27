// Titanium-free component for one taxon on the comparison screen: its photo, its
// name across the bottom, and the single tap surface that browses out to it.
// The card's view-model owns the browse intent, so the screen wires nothing per
// card — the same shape as SampleTaxaIcon.
const BINDINGS = {
  TaxonComparisonPhoto: { accessibilityLabel: "name", onClick: "open" },
  photo:                { image: "photoUrl", visible: "hasPhoto" },
  caption:              { text: "name" },
};

module.exports = function createTaxonComparisonPhoto({ view, args, bindView }) {
  const unbind = bindView(view, args.rowVm, BINDINGS);
  return { dispose: unbind };
};

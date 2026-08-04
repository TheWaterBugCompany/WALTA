// Titanium-free binder for a tray tile — an interior tile or the endcap. Both are
// the same shape: a positioned background plus a hole grid whose cells are a
// polymorphic bindView collection (each slot names its own component, a
// SampleTaxaIcon or a SampleTrayPlus). The tile VM supplies the one view
// difference between the two — the hole grid's layout and inset (horizontal/full
// for a tile, vertical/lipped for the endcap) — as bound properties, so a single
// component renders both. See docs/patterns/screen-controllers.md.
module.exports = function bindSampleTrayTile({ view, args, bindView }) {
  const { collection } = bindView;
  const unbind = bindView(view, args.rowVm, {
    cell:          { left: "leftCss", width: "widthCss", height: "heightCss" },
    background:    { image: "backgroundImage" },
    holeContainer: {
      layout: "holesLayout",
      width: "holesWidthCss",
      left: "holesLeftCss",
      taxa: collection("taxa"),
    },
  });
  return { dispose: unbind };
};

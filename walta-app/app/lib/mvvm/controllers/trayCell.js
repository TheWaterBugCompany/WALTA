// Shared Titanium-free binder for a tray cell (an interior tile or the endcap).
// Both are the same shape: a positioned background plus a hole container whose
// cells are a bindView collection of SampleTaxaIcon slots. The cell VM
// (TileViewModel / EndcapViewModel) differs only in geometry + background; the
// binder is identical. See docs/patterns/screen-controllers.md.
module.exports = function bindTrayCell({ view, args, bindView }) {
  const { collection } = bindView;
  const unbind = bindView(view, args.rowVm, {
    cell:          { left: "leftCss", width: "widthCss", height: "heightCss" },
    background:    { image: "backgroundImage" },
    holeContainer: { taxa: collection("taxa", "SampleTaxaIcon") },
  });
  return { dispose: unbind };
};

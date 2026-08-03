// Shared Titanium-free binder for a tray cell (an interior tile or the endcap).
// Both are the same shape: a positioned background with a hole container. This
// declares the geometry binding and drives the residual hole rendering the Alloy
// controller exposes; the endcap and tile differ only in their hole-container
// layout (in TSS). See docs/patterns/screen-controllers.md.
module.exports = function bindTrayCell({ view, args, bindView }) {
  const cellVm = args.rowVm;

  const unbind = bindView(view, cellVm, {
    cell:       { left: "leftCss", width: "widthCss", height: "heightCss" },
    background: { image: "backgroundImage" },
  });

  const render = () => view.renderHoles(cellVm.holes, {
    holeWidthCss: cellVm.holeWidthCss,
    readonly: cellVm.readonly,
  });
  render();
  cellVm.addListener(render);

  return {
    dispose() {
      cellVm.removeListener(render);
      unbind();
    },
  };
};

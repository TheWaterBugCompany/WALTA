// The SampleEditMenu overlay's view/edit actions manipulate Alloy models, so
// they stay in the Alloy shell (residual Ti) for now. This routes its close
// button to the modal seam. See docs/patterns/screen-controllers.md.
module.exports = function createSampleEditMenuController({ view, close }) {
  const onClose = () => close();
  view.on("close", onClose);
  return {
    dispose() { view.off("close", onClose); },
  };
};

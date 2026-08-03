const SampleHistoryViewModel = require("viewmodels/SampleHistory");

// Titanium-free screen controller for the SampleHistory window. Declares the
// sample table as a collection of SampleHistoryRow components; the injected
// bindView owns the keyed diff and the row lifecycle, the row owns its own tap.
// See docs/patterns/screen-controllers.md.
module.exports = function createSampleHistoryController({ view, services, bindView }) {
  const { collection } = bindView;
  const vm = new SampleHistoryViewModel({
    sampleSource: view.sampleSource,
    topics: services.topics,
  });

  const unbind = bindView(view, vm, {
    sampleTable: { rows: collection("rows", "SampleHistoryRow") },
  });

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};

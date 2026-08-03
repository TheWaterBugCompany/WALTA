const SampleHistoryViewModel = require("viewmodels/SampleHistory");
const bindView = require("util/bindView");
const { collection } = bindView;

// Titanium-free screen controller for the SampleHistory window. Declares the
// sample table as a collection of SampleHistoryRow components; bindView owns the
// keyed diff and the row lifecycle, the row owns its own tap. The createComponent
// factory (the one seam that reaches Titanium) is injected via bindView options.
// See docs/patterns/screen-controllers.md.
module.exports = function createSampleHistoryController({ view, services }) {
  const vm = new SampleHistoryViewModel({
    sampleSource: view.sampleSource,
    topics: services.topics,
  });

  const unbind = bindView(view, vm, {
    sampleTable: { rows: collection("rows", "SampleHistoryRow") },
  }, { createComponent: services.View.createComponent.bind(services.View) });

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};

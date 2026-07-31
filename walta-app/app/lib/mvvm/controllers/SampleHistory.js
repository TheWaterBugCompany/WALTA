const SampleHistoryViewModel = require("viewmodels/SampleHistory");
const bindView = require("util/bindView");
const { collection } = bindView;

// Titanium-free screen controller for the SampleHistory window. Binds the sample
// table to the view-model's rows via the collection binding: bindView owns the
// keyed diff, the adapter is the irreducible Ti seam (create a row through View,
// render the ordered list, dispose). See docs/patterns/screen-controllers.md.
module.exports = function createSampleHistoryController({ view, services }) {
  const topics = services.topics;
  const vm = new SampleHistoryViewModel({
    sampleSource: view.sampleSource,
    topics,
  });

  const rows = collection("rows", {
    key: (row) => row.sampleId,
    create: (row) => {
      const handle = services.View.createComponent("SampleHistoryRow", { rowVm: row });
      handle.lib.on("selected", (sampleId) => topics.fireTopicEvent(topics.EDIT_SAMPLE, { sampleId }));
      return handle;
    },
    render: (table, handles) => table.setData(handles.map((h) => h.view)),
    dispose: (handle) => handle.dispose(),
  });

  const unbind = bindView(view, vm, {
    sampleTable: { rows },
  });

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};

const bindView = require("util/bindView");

// Titanium-free first-class row component. Binds its row view-model into the
// columns and owns its own tap, firing the EDIT_SAMPLE intent itself so the
// parent list needs no per-row wiring. See docs/patterns/screen-controllers.md.
const ROW_BINDINGS = {
  idColumn:            { text: "serverId" },
  dateCompletedColumn: { text: "dateCompleted" },
  waterbodyName:       { text: "waterbodyName" },
  boolColumn:          { text: "uploaded" },
};

module.exports = function createSampleHistoryRow({ view, args, services }) {
  const rowVm = args.rowVm;
  const topics = services.topics;
  const unbind = bindView(view, rowVm, ROW_BINDINGS);

  // Per-row click by stable id — Android drops table-level click dispatch on
  // reused / reordered row proxies (WB-168), so the row owns its own tap.
  const onClick = () => topics.fireTopicEvent(topics.EDIT_SAMPLE, { sampleId: rowVm.sampleId });
  const rowView = view.getView();
  rowView.addEventListener("click", onClick);

  return {
    dispose() {
      rowView.removeEventListener("click", onClick);
      unbind();
    },
  };
};

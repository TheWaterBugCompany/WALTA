const bindView = require("util/bindView");
const ChangeNotifier = require("util/ChangeNotifier");

// Titanium-free first-class row component. Binds its row view-model into the
// columns and owns its own tap, firing "selected" for the parent to handle.
// See docs/patterns/screen-controllers.md.
const ROW_BINDINGS = {
  idColumn:            { text: "serverId" },
  dateCompletedColumn: { text: "dateCompleted" },
  waterbodyName:       { text: "waterbodyName" },
  boolColumn:          { text: "uploaded" },
};

module.exports = function createSampleHistoryRow({ view, args }) {
  const rowVm = args.rowVm;
  const emitter = new ChangeNotifier();
  const unbind = bindView(view, rowVm, ROW_BINDINGS);

  // Per-row click by stable id — Android drops table-level click dispatch on
  // reused / reordered row proxies (WB-168), so the row owns its own tap.
  const onClick = () => emitter.trigger("selected", rowVm.sampleId);
  const rowView = view.getView();
  rowView.addEventListener("click", onClick);

  return {
    on(event, cb) { emitter.on(event, cb); },
    off(event, cb) { emitter.off(event, cb); },
    dispose() {
      rowView.removeEventListener("click", onClick);
      unbind();
      emitter.dispose();
    },
  };
};

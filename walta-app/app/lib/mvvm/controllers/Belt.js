// Titanium-free component controller for one belt, drawn as a bar with an
// outline and — where the belt has one — a tip banded across it.
// See docs/patterns/screen-controllers.md.
const BINDINGS = {
  belt:    { backgroundColor: "color", accessibilityLabel: "label" },
  beltTip: { visible: "tipVisible", backgroundColor: "tipColor" },
};

module.exports = function createBelt({ view, args, bindView }) {
  const unbind = bindView(view, args.rowVm, BINDINGS);
  return { dispose: unbind };
};

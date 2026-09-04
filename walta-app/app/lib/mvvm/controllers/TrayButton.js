// Titanium-free screen controller for the anchor-bar ice-cube button.
// See docs/patterns/screen-controllers.md.
const BINDINGS = {
  icon: { visible: "visible", onClick: "select" },
};

module.exports = function createTrayButton({ view, args, bindView }) {
  const unbind = bindView(view, args.vm, BINDINGS);
  return { dispose() { unbind(); } };
};

const { present } = require("util/bindView");

// Titanium-free screen controller for the anchor-bar ice-cube button.
// See docs/patterns/screen-controllers.md.
const BINDINGS = {
  // present, not merely visible: the anchor bar centres its title between the two
  // tool groups, so a hidden-but-laid-out tool would push the title off centre.
  icon: { visible: present("visible"), onClick: "select" },
};

module.exports = function createTrayButton({ view, args, bindView }) {
  const unbind = bindView(view, args.vm, BINDINGS);
  return { dispose() { unbind(); } };
};

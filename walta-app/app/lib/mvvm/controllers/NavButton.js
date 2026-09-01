// Titanium-free binder for one anchor-bar button: its caption, the colours it
// wears at rest, under a finger and when it can't be used, and the tap that
// routes through the view-model (which no-ops a disabled button).
// See docs/patterns/screen-controllers.md.
const { pressable } = require("../../util/bindView");

const BINDINGS = {
  button: {
    backgroundColor: pressable("buttonColor", "buttonPressedColor"),
    borderColor: pressable("buttonColor", "buttonPressedColor"),
    accessibilityLabel: "accessibilityLabel",
    onClick: "select",
  },
  label: {
    text: "label",
    color: "labelColor",
  },
};

module.exports = function createNavButton({ view, args, bindView }) {
  const unbind = bindView(view, args.rowVm, BINDINGS);

  return {
    dispose() { unbind(); },
  };
};

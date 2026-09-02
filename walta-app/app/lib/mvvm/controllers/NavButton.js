// Titanium-free binder for one anchor-bar button: its caption, the colours it
// wears at rest, under a finger and when it can't be used, and the tap that
// routes through the view-model (which no-ops a disabled button).
// See docs/patterns/screen-controllers.md.
const { pressable } = require("../../util/bindView");

// The tap is taken on the root, which is the control's whole hit area and where
// it has always been taken; the chrome that paints is the button inside it.
const BINDINGS = {
  NavButton: {
    onClick: "select",
  },
  button: {
    backgroundColor: pressable("buttonColor", "buttonPressedColor"),
    borderColor: pressable("buttonColor", "buttonPressedColor"),
    touchEnabled: "touchEnabled",
    enabled: "enabled",
  },
  label: {
    text: "label",
    // The a11y label rides on the label, not the chrome: iOS `~id` locators and
    // the device specs both read it from there.
    accessibilityLabel: "accessibilityLabel",
    color: "labelColor",
  },
};

module.exports = function createNavButton({ view, args, bindView }) {
  const unbind = bindView(view, args.rowVm, BINDINGS);

  return {
    dispose() { unbind(); },
  };
};

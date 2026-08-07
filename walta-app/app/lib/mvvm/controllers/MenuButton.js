// Titanium-free binder for a menu-entry row-VM (a MenuEntry): its icon, title
// and description, the card height, the greyed styling, the a11y label, and the
// tap that routes through the VM (which no-ops a disabled entry). Used as a
// collection component by MethodSelect. See docs/patterns/screen-controllers.md.
const BINDINGS = {
  icon:        { image: "icon" },
  title:       { text: "title" },
  description: { text: "description" },
  button:      {
    height: "size",
    backgroundColor: "buttonColor",
    opacity: "buttonOpacity",
    accessibilityLabel: "accessibilityLabel",
    onClick: "select",
  },
};

module.exports = function createMenuButton({ view, args, bindView }) {
  const rowVm = args.rowVm;
  const unbind = bindView(view, rowVm, BINDINGS);

  return {
    dispose() { unbind(); },
  };
};

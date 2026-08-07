// Titanium-free binder for a menu-entry row-VM (a MenuEntry): its icon, title
// and description, the greyed styling, and the tap that routes through the VM
// (which no-ops a disabled entry). Used as a collection component by
// MethodSelect. See docs/patterns/screen-controllers.md.
const BINDINGS = {
  icon:        { image: "icon" },
  title:       { text: "title" },
  description: { text: "description" },
  button:      { backgroundColor: "buttonColor", opacity: "buttonOpacity", onClick: "select" },
};

module.exports = function createMenuButton({ view, args, bindView }) {
  const rowVm = args.rowVm;
  const unbind = bindView(view, rowVm, BINDINGS);

  return {
    dispose() { unbind(); },
  };
};

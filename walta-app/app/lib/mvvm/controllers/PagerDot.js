// Titanium-free component controller for one dot of a photo pager's position
// indicator. The pager tells the dot whether it is the one in view; the dot only
// says how that looks. See docs/patterns/screen-controllers.md.
const BINDINGS = {
  dot: { opacity: "opacity", accessibilityLabel: "accessibilityLabel" },
};

module.exports = function createPagerDot({ view, args, bindView }) {
  const unbind = bindView(view, args.rowVm, BINDINGS);
  return { dispose: unbind };
};

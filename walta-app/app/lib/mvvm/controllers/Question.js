const { apply } = require("util/bindView");

// Titanium-free component for one branch of a couplet: its text, its photo, and
// the hint outline that marks it correct or incorrect. The tap surface is the
// card rather than the outline, so the hint frame can sit outside it without
// swallowing clicks. See docs/patterns/screen-controllers.md.
const BINDINGS = {
  hintFrame:          { borderColor: "borderColor", borderWidth: "borderWidth" },
  verdictIcon:        { image: "verdictImage", visible: "verdictVisible", accessibilityLabel: "verdict" },
  question:           { text: "text", width: "textWidth" },
  photoSelectWrapper: { visible: "photoVisible", width: "photoWidth" },
  card:               { left: "cardLeft", onClick: "select" },
};

module.exports = function createQuestionComponent({ view, args, bindView }) {
  const vm = args.rowVm;
  // PhotoSelect takes its photos through a setter, and rejects being handed
  // none — so a branch without a photo simply doesn't bind it.
  const bindings = vm.hasPhoto
    ? Object.assign({ photoSelect: { setImage: apply("photoUrls") } }, BINDINGS)
    : BINDINGS;
  const unbind = bindView(view, vm, bindings);
  return { vm, dispose() { unbind(); } };
};

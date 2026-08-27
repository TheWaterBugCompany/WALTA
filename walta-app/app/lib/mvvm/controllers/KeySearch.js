const KeySearchViewModel = require("mvvm/viewmodels/KeySearch");
// Marker for the module-scope BINDINGS; the binder itself is injected.
const { collection } = require("util/bindView");

// Titanium-free screen controller for the KeySearch couplet. Builds the
// view-model from the open payload — including any hint the caller threaded
// through — and binds the two branches as a collection of Question components,
// each of which owns its own tap. See docs/patterns/screen-controllers.md.
const BINDINGS = {
  questions: { rows: collection("questions", "Question") },
  upButton:  { visible: "canGoUp", onClick: "goUp" },
};

module.exports = function createKeySearchController({ view, services, bindView, args }) {
  const { key, node, hint = null, surveyType = null, allowAddToSample = false, position = null, training = false } = args || {};
  const vm = new KeySearchViewModel({
    key, node, topics: services.topics, hint, surveyType, allowAddToSample, position, training,
  });
  const unbind = bindView(view, vm, BINDINGS);

  return {
    vm,
    dispose() { unbind(); vm.dispose(); },
  };
};

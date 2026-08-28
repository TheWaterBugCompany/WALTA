const { collection } = require("util/bindView");
const TaxonComparisonViewModel = require("mvvm/viewmodels/TaxonComparison");

// Titanium-free screen controller for the taxon comparison modal: the verdict
// icon and sentence, the one-or-two photo cards, and the action that belongs to
// this verdict. See docs/patterns/screen-controllers.md.
const BINDINGS = {
  verdictIcon:       { image: "verdictImage" },
  comparisonMessage: { text: "message" },
  photos:            { cards: collection("cards", "TaxonComparisonPhoto") },
  action:            { onClick: "activate" },
  actionText:        { text: "actionLabel" },
  closeButton:       { onClose: "close" },
};

module.exports = function createTaxonComparisonController({ view, close, services, bindView, args }) {
  const { key, selectedTaxonId, correctTaxonId, onWhichQuestion } = args || {};
  const vm = new TaxonComparisonViewModel({
    key: key,
    topics: services.topics,
    selectedTaxonId,
    correctTaxonId,
  });
  const unbind = bindView(view, vm, BINDINGS);
  vm.on("close", () => close());
  // Walking back to the couplet is the caller's job (WB-253); this screen only
  // says the reader asked.
  if (onWhichQuestion) { vm.on("which-question", onWhichQuestion); }

  return {
    vm,
    dispose() { unbind(); vm.dispose(); },
  };
};

// Adapts a training SampleTray to the tray view-model's source interface —
// the training counterpart of SampleTraySource (which wraps the survey's Alloy
// taxa collection). Training taxa carry no abundance and their display resolves
// from the key, so this stays free of Alloy/Ti and is Node-testable against a
// real SampleTray and a fake key.

function toIconData(taxon, key) {
  const keyTaxon = key.findTaxonById(taxon.taxonId);
  return {
    taxonId: taxon.taxonId,
    sampleTaxonId: taxon.id,
    abundance: null,
    silhouette: keyTaxon ? keyTaxon.bluebug[0] : "/images/unknown-bug-icon.png",
    name: keyTaxon ? keyTaxon.name : "unknown",
  };
}

module.exports = function createTrainingTraySource(tray, key, readonly) {
  return {
    length: function () { return tray.length; },
    // Sparse: a taxon can be identified into any numbered cell.
    at: function (i) {
      const taxon = tray.taxa().find((t) => t.position === i);
      return taxon ? toIconData(taxon, key) : undefined;
    },
    // Training has no survey type; null routes the key to its root — the full
    // key — matching a plain identify (see Main.js key entry-point selection).
    surveyType: function () { return null; },
    // Change observation rides the SampleTray aggregate's own notifier, so the
    // view-model refreshes when the key adds a taxon to the shared tray.
    onChange: function (cb) { tray.addListener(cb); },
    offChange: function (cb) { tray.removeListener(cb); },
    readonly: readonly === true,
  };
};

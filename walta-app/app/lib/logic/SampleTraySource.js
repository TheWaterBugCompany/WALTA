// Alloy-model reads for the ice-cube tray, behind the source-adapter seam the
// SampleTrayViewModel is built from. Model access (allowed in the mvvm layer,
// unlike Ti views) lives here rather than in the window shell, so the VM stays
// Node-testable against a fake source. Unlike SampleHistorySource this is built
// per-screen from the live `taxa` collection + the key (both per-sample), so the
// Alloy shell constructs it and hands it to the screen controller.
function toIconData(m, key) {
  var taxonId = m.get("taxonId");
  var keyTaxon = key.findTaxonById(taxonId);
  return {
    taxonId: taxonId,
    sampleTaxonId: m.get("sampleTaxonId"),
    abundance: m.get("abundance"),
    silhouette: m.getSilhouette(),
    name: keyTaxon ? keyTaxon.name : "unknown",
  };
}

module.exports = function createSampleTraySource(taxaCollection, key, readonly) {
  return {
    length: function () { return taxaCollection.length; },
    at: function (i) {
      return toIconData(taxaCollection.at(i), key);
    },
    // The add-to-sample intent needs the current sample's survey type (a model
    // read, kept behind this seam so the VM stays Ti/Alloy-free).
    surveyType: function () { return parseInt(Alloy.Models.sample.get("surveyType")); },
    // Collection observation lives behind the source so the VM subscribes to its
    // data changing without the window shell wiring Alloy events.
    onChange: function (cb) { taxaCollection.on("add change remove", cb); },
    offChange: function (cb) { taxaCollection.off("add change remove", cb); },
    readonly: readonly === true,
  };
};

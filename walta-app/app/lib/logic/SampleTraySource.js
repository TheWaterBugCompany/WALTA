// Alloy-model reads for the ice-cube tray, behind the source-adapter seam the
// SampleTrayViewModel is built from. Model access (allowed in the mvvm layer,
// unlike Ti views) lives here rather than in the window shell, so the VM stays
// Node-testable against a fake source. Unlike SampleHistorySource this is built
// per-screen from the live `taxa` collection + the key (both per-sample), so the
// Alloy shell constructs it and hands it to the screen controller.
function toIconData(m, key) {
  var taxonId = m.get("taxonId");
  var keyTaxon = key && taxonId ? key.findTaxonById(taxonId) : null;
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
      var m = taxaCollection.at(i);
      return m ? toIconData(m, key) : undefined;
    },
    readonly: readonly === true,
  };
};

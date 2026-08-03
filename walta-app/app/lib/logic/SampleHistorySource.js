// Alloy-model reads for the sample-history list, behind the source-adapter seam
// the SampleHistory view-model is built from. Model access (allowed in the mvvm
// layer, unlike Ti views) lives here rather than in the window shell; a future
// model abstraction swaps what this wraps. Injected via the services bag, so the
// screen controller stays Node-testable against a fake source.
function toRowData(m) {
  var json = m.transform();
  return {
    serverId: m.get("serverSampleId"),
    sampleId: m.get("sampleId"),
    dateCompleted: json.dateCompleted,
    waterbodyName: json.waterbodyName,
    uploaded: json.uploaded,
  };
}

module.exports = function createSampleHistorySource({ cerdiApi }) {
  return {
    loadAll: function () {
      var samples = Alloy.createCollection("sample");
      samples.loadSampleHistory(cerdiApi.retrieveUserId());
      return samples.map(toRowData);
    },
    loadOne: function (sampleId) {
      var m = Alloy.createModel("sample");
      m.loadById(sampleId);
      if (!m.get("sampleId")) return undefined;
      return toRowData(m);
    },
  };
};

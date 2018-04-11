var database = {
  DATABASE_NAME: "samples",
  DATABASE_FILE_NAME: "samples.mysql",

  samples: function() {
    return Alloy.Collections.instance("sample");
  },

  currentSample: function() {
    return Alloy.Collections.instance("taxa");
  },

  load: function() {
    this.samples().fetch();
    this.currentSample().fetch({ query: "SELECT * FROM taxa WHERE sampleId = (SELECT sampleId FROM sample WHERE dateCompleted IS NULL)"} );
  }
};

module.exports = database;

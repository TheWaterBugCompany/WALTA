require("mocha");
const { expect } = require("chai");
const createSampleTraySource = require("../../walta-app/app/lib/logic/SampleTraySource");

// Minimal fakes — the source is a pure adapter over an injected taxa collection,
// key and sample, so it needs no Alloy/Ti globals.
function fakeSample(attrs) {
  return { get: (k) => attrs[k] };
}
function fakeTaxa(models) {
  return {
    length: models.length,
    at: (i) => models[i],
    on() {}, off() {},
  };
}
function fakeKey() {
  return { findTaxonById: () => ({ name: "Notonectidae" }) };
}

describe("SampleTraySource", function () {
  it("reads surveyType from the injected sample, not a global", function () {
    const source = createSampleTraySource(fakeTaxa([]), fakeKey(), false, fakeSample({ surveyType: 2 }));
    expect(source.surveyType()).to.equal(2);
  });
});

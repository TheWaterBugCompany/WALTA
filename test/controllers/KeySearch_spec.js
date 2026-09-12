require("mocha");
const { expect } = require("chai");

const Key = require("logic/Key");
const Question = require("logic/Question");
const Taxon = require("logic/Taxon");
const createKeySearchController = require("../../walta-app/app/lib/mvvm/controllers/KeySearch");
const Topics = require("../../walta-app/app/lib/ui/Topics");

function buildKey() {
  const key = Key.createKey({ url: "https://example.com", name: "WALTA" });
  const t1 = Taxon.createTaxon({ id: "t1", taxonId: "1", name: "Taxon 1" });
  const t2 = Taxon.createTaxon({ id: "t2", taxonId: "2", name: "Taxon 2" });
  [t1, t2].forEach((t) => key.attachTaxon(t));
  const n1 = Key.createKeyNode({ id: "n1", questions: [
    Question.createQuestion({ text: "Q1" }), Question.createQuestion({ text: "Q2" }),
  ] });
  key.setRootNode(n1);
  key.linkTaxonToParent(n1, 0, t1);
  key.linkTaxonToParent(n1, 1, t2);
  return { key, n1 };
}

describe("KeySearch controller", function () {
  afterEach(function () { Topics.reset(); });

  // The trail defaults to a do-nothing one, so a screen that never receives the
  // real one still works — and silently stops recording. Only this catches that.
  it("gives the view-model the trail the session is keeping", function () {
    const { key, n1 } = buildKey();
    const entered = [];
    const keyTrail = {
      enter(node) { entered.push(node.id); },
      step() {}, parentOf() { return null; }, route() { return null; }, reset() {},
    };
    createKeySearchController({
      view: {}, services: { topics: Topics, keyTrail }, bindView: () => () => {},
      args: { key, node: n1 },
    });
    expect(entered).to.deep.equal(["n1"]);
  });
});

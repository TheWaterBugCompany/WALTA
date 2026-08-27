require("mocha");
const { expect } = require("chai");

const Key = require("logic/Key");
const Question = require("logic/Question");
const Taxon = require("logic/Taxon");
const Topics = require("../../walta-app/app/lib/ui/Topics");
const KeySearchViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/KeySearch");

// A couplet (n1) whose first branch leads on to another couplet (n2) and whose
// second ends at a taxon, so a hint can name either kind of outcome.
//
//        n1 ── q0 ──> n2 ── q0 ──> t1
//         │            └── q1 ──> t2
//         └── q1 ──> t3
function buildKey() {
    const key = Key.createKey({ url: "https://example.com", name: "WALTA" });
    const t1 = Taxon.createTaxon({ id: "t1", taxonId: "1", name: "Taxon 1" });
    const t2 = Taxon.createTaxon({ id: "t2", taxonId: "2", name: "Taxon 2" });
    const t3 = Taxon.createTaxon({ id: "t3", taxonId: "3", name: "Taxon 3" });
    [t1, t2, t3].forEach((t) => key.attachTaxon(t));

    const n1 = Key.createKeyNode({ id: "n1", questions: [
        Question.createQuestion({ text: "Animal with a shell (snails and mussels)" }),
        Question.createQuestion({ text: "Animal without a shell" }),
    ] });
    const n2 = Key.createKeyNode({ id: "n2", questions: [
        Question.createQuestion({ text: "Q3" }),
        Question.createQuestion({ text: "Q4" }),
    ] });
    key.setRootNode(n1);
    key.linkNodeToParent(n1, 0, n2);
    key.linkTaxonToParent(n1, 1, t3);
    key.linkTaxonToParent(n2, 0, t1);
    key.linkTaxonToParent(n2, 1, t2);
    return { key, n1, n2 };
}

function build({ node, hint } = {}) {
    const { key, n1, n2 } = buildKey();
    return new KeySearchViewModel({
        key, node: node === "n2" ? n2 : n1, topics: Topics, hint,
    });
}

describe("KeySearchViewModel", function () {
    afterEach(function () { Topics.reset(); });

    it("marks the hinted branches correct and incorrect on the node the hint names", function () {
        const vm = build({ hint: { nodeId: "n1", correctRef: "t3", incorrectRef: "n2" } });
        expect(vm.questions.map(q => q.verdict)).to.deep.equal(["incorrect", "correct"]);
    });

    it("leaves both branches unmarked on a couplet the hint does not name", function () {
        const vm = build({ node: "n2", hint: { nodeId: "n1", correctRef: "t3", incorrectRef: "n2" } });
        expect(vm.questions.map(q => q.verdict)).to.deep.equal([null, null]);
    });

    it("leaves both branches unmarked when there is no hint", function () {
        expect(build().questions.map(q => q.verdict)).to.deep.equal([null, null]);
    });

    it("carries the hint forward so returning to the couplet shows it again", function () {
        const hint = { nodeId: "n1", correctRef: "t3", incorrectRef: "n2" };
        const vm = build({ hint });
        let forwarded = null;
        Topics.subscribe(Topics.FORWARD, (data) => { forwarded = data; });
        vm.questions[0].select();
        expect(forwarded.hint).to.deep.equal(hint);
    });

    it("chooses from the couplet it was opened on, wherever the key was left", function () {
        const { key, n1, n2 } = buildKey();
        key.setCurrentNodeObj(n1);
        const vm = new KeySearchViewModel({ key, node: n2, topics: Topics });
        let forwarded = null;
        Topics.subscribe(Topics.FORWARD, (data) => { forwarded = data; });
        vm.questions[0].select();
        expect(forwarded.node.id).to.equal("t1");
    });

    it("goes up to the parent couplet, carrying the hint", function () {
        const { key, n1, n2 } = buildKey();
        const hint = { nodeId: "n1", correctRef: "t3", incorrectRef: "n2" };
        const vm = new KeySearchViewModel({ key, node: n2, topics: Topics, hint });
        let up = null;
        Topics.subscribe(Topics.UP, (data) => { up = data; });
        vm.goUp();
        expect(up.node.id).to.equal("n1");
        expect(up.hint).to.deep.equal(hint);
    });

    it("has nowhere to go up from the root couplet", function () {
        expect(build().canGoUp).to.equal(false);
    });

    it("can go up from a couplet below the root", function () {
        const { key, n2 } = buildKey();
        expect(new KeySearchViewModel({ key, node: n2, topics: Topics }).canGoUp).to.equal(true);
    });

    it("advances the key to the chosen branch", function () {
        const vm = build();
        let forwarded = null;
        Topics.subscribe(Topics.FORWARD, (data) => { forwarded = data; });
        vm.questions[0].select();
        expect(forwarded.node.id).to.equal("n2");
    });
});

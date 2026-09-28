require("mocha");
const { expect } = require("chai");
const Topics = require("../../walta-app/app/lib/ui/Topics");

describe("Topics", function () {
    afterEach(function () { Topics.reset(); });

    it("delivers a topic to every subscriber, in the order they subscribed", function () {
        const seen = [];
        Topics.subscribe(Topics.LOGGEDIN, () => seen.push("first"));
        Topics.subscribe(Topics.LOGGEDIN, () => seen.push("second"));
        Topics.fireTopicEvent(Topics.LOGGEDIN, null);
        expect(seen).to.deep.equal(["first", "second"]);
    });

    // Subscribers have never heard of each other — that is what the bus is for.
    // A handler that throws used to take the rest of the list with it, so adding
    // a subscriber quietly made it depend on every handler registered before it.
    it("keeps delivering past a subscriber that throws", function () {
        const seen = [];
        Topics.subscribe(Topics.LOGGEDIN, () => { throw new Error("handler is broken"); });
        Topics.subscribe(Topics.LOGGEDIN, () => seen.push("behind the broken one"));
        try { Topics.fireTopicEvent(Topics.LOGGEDIN, null); } catch (e) { /* raised below */ }
        expect(seen).to.deep.equal(["behind the broken one"]);
    });

    // A broken handler is still a defect to see. Isolating subscribers from each
    // other must not turn one into a silent no-op.
    it("still raises the failure once everyone has been delivered to", function () {
        Topics.subscribe(Topics.LOGGEDIN, () => { throw new Error("handler is broken"); });
        Topics.subscribe(Topics.LOGGEDIN, () => {});
        expect(() => Topics.fireTopicEvent(Topics.LOGGEDIN, null)).to.throw("handler is broken");
    });

    // Two broken handlers would otherwise raise whichever ran last, which reads
    // as the later one being at fault.
    it("raises the first failure when more than one subscriber throws", function () {
        Topics.subscribe(Topics.LOGGEDIN, () => { throw new Error("first to break"); });
        Topics.subscribe(Topics.LOGGEDIN, () => { throw new Error("second to break"); });
        expect(() => Topics.fireTopicEvent(Topics.LOGGEDIN, null)).to.throw("first to break");
    });

    it("carries the event data to each subscriber", function () {
        const seen = [];
        Topics.subscribe(Topics.JUMPTO, (d) => seen.push(d));
        Topics.fireTopicEvent(Topics.JUMPTO, { id: "couplet-7" });
        expect(seen).to.deep.equal([{ id: "couplet-7" }]);
    });

    it("refuses to fire a topic that does not exist", function () {
        expect(() => Topics.fireTopicEvent(undefined, null)).to.throw("undefined topic");
    });
});

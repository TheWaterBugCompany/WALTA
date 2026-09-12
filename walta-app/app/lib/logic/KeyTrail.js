// The couplets the reader actually walked through on the way to an
// identification.
//
// The key is a DAG: several nodes have more than one way in, and a node records
// only one parentLink, so walking parentLink back up answers "where does this
// node hang?" rather than "how did you get here?". Only a record of the walk can
// answer the second, and that is what names the question a reader got wrong.
//
// Nodes are held by identity, not by ref: the Ink loader can mint anonymous
// nodes with an empty id.
module.exports = function createKeyTrail({ key }) {
  let walked = [];

  return {
    // Opening a couplet screen. A seed replaces the trail outright — the
    // correction jump lands mid-key and carries the route that got there, which
    // beats rewinding because the same couplet can sit on the live trail under a
    // different prefix. Otherwise re-opening a couplet already walked rewinds to
    // it, so the next branch appends to the real prefix; anything else is a jump
    // with no history behind it.
    enter(node, seedRefs = null) {
      if (seedRefs) {
        walked = seedRefs.map((ref) => key.findNode(ref)).filter((n) => n);
        return;
      }
      const seen = walked.indexOf(node);
      walked = seen < 0 ? [node] : walked.slice(0, seen + 1);
    },

    step(node) { walked.push(node); },

    // The couplet this node was walked in from, or null if it wasn't.
    parentOf(node) {
      const at = walked.indexOf(node);
      return at > 0 ? walked[at - 1] : null;
    },

    route() { return walked.length ? walked.map((n) => n.id) : null; },

    reset() { walked = []; },
  };
};

// For the screens that have no trail to record against — every survey-flow
// KeySearch, and the specs that predate one.
module.exports.none = {
  enter() {},
  step() {},
  parentOf() { return null; },
  route() { return null; },
  reset() {},
};

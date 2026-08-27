const ChangeNotifier = require("../../util/ChangeNotifier");
const QuestionViewModel = require("./Question");

// State for the KeySearch screen: the couplet's two branches as row-VMs, and the
// hint that marks which of them is the right answer.
//
// A hint names the couplet it belongs to, so it shows on that couplet and
// nowhere else — navigate on and the next screen builds without it, come back
// and it is applied again. Titanium-free.
class KeySearchViewModel extends ChangeNotifier {
  constructor({ key, node, topics, hint = null, surveyType = null, allowAddToSample = false, position = null, training = false }) {
    super();
    this._key = key;
    this._node = node;
    this._topics = topics;
    this._hint = hint;
    // The context every navigation off this screen carries on with — including
    // the hint, so walking away and back re-applies it.
    this._context = { surveyType, allowAddToSample, position, training, hint };
    // The key carries the reader's position as state, and a screen can be opened
    // on a couplet the key was not left on (back, or a jump). Anchor it here so
    // choose() and isRoot() answer for the couplet on screen.
    key.setCurrentNodeObj(node);
    this._questions = node.questions.map((question, index) => new QuestionViewModel({
      key: String(index),
      question,
      verdict: this._verdictFor(question),
      onSelect: () => this._choose(index),
    }));
  }

  get questions() { return this._questions; }

  get isRoot() { return this._key.isRoot(); }

  get canGoUp() { return !this.isRoot; }

  goUp() {
    if (this.isRoot) { return; }
    this._navigate(this._topics.UP, { node: this._node.parentLink, slide: "left" });
  }

  _choose(index) {
    this._key.choose(index);
    this._navigate(this._topics.FORWARD, { node: this._key.getCurrentNode() });
  }

  _navigate(topic, data) {
    this._topics.fireTopicEvent(topic, Object.assign({}, this._context, data));
  }

  _verdictFor(question) {
    if (!this._hint || this._hint.nodeId !== this._node.id) { return null; }
    const outcome = question.outcome && question.outcome.id;
    if (outcome === this._hint.correctRef) { return "correct"; }
    if (outcome === this._hint.incorrectRef) { return "incorrect"; }
    return null;
  }
}

module.exports = KeySearchViewModel;

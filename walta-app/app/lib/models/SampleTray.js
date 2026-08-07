const ChangeNotifier = require("../util/ChangeNotifier");

// The ice-cube tray — the ordered collection of Taxon the whole app revolves
// around. A pure domain aggregate: it knows nothing about persistence (a
// repository hydrates and persists it) and nothing about presentation (the
// SampleTrayViewModel owns tiles and scroll). It's observable so the view
// reloads when a taxon is added or removed. Taxa are kept ordered by their
// caller-assigned position, so placement isn't tied to insertion order.

function byPosition(a, b) { return a.position - b.position; }

class SampleTray extends ChangeNotifier {
  constructor(taxa) {
    super();
    this._taxa = (taxa || []).slice().sort(byPosition);
  }

  get length() { return this._taxa.length; }

  at(i) { return this._taxa[i]; }

  taxa() { return this._taxa.slice(); }

  add(taxon) {
    this._taxa.push(taxon);
    this._taxa.sort(byPosition);
    this.notifyListeners();
  }

  remove(taxon) {
    this._taxa = this._taxa.filter(t => t.id !== taxon.id);
    this.notifyListeners();
  }
}

module.exports = SampleTray;

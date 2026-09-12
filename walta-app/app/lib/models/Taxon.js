// A creature placed in the SampleTray: a domain entity, decoupled from any
// persistence engine. `id` is the stable identity (the tray's verdict key);
// `position` is the tray slot; `taxonId` points at the taxon in the key;
// `route` is the couplets walked to reach it, which is what tells the key which
// question was answered wrongly when a taxon has more than one way in.
class Taxon {
  constructor({ id, taxonId, position, route = null }) {
    this._id = id;
    this._taxonId = taxonId;
    this._position = position;
    this._route = route;
  }

  get id() { return this._id; }
  get taxonId() { return this._taxonId; }
  get position() { return this._position; }
  get route() { return this._route; }
}

module.exports = Taxon;

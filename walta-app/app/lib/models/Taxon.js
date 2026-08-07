// A creature placed in the SampleTray: a domain entity, decoupled from any
// persistence engine. `id` is the stable identity (the tray's verdict key);
// `position` is the tray slot; `taxonId` points at the taxon in the key.
class Taxon {
  constructor({ id, taxonId, position }) {
    this._id = id;
    this._taxonId = taxonId;
    this._position = position;
  }

  get id() { return this._id; }
  get taxonId() { return this._taxonId; }
  get position() { return this._position; }
}

module.exports = Taxon;

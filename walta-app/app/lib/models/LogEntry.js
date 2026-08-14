// A single persisted log line: a domain entity, decoupled from any
// persistence engine, mirroring the other repository-backed models.
// Deliberately anemic — logs carry no behaviour — so the whole app uses
// one repository shape rather than a Repository/row-DAO split.
class LogEntry {
  constructor({ ts, level, facility, message }) {
    this._ts = ts;
    this._level = level;
    this._facility = facility;
    this._message = message;
  }

  get ts() { return this._ts; }
  get level() { return this._level; }
  get facility() { return this._facility; }
  get message() { return this._message; }
}

module.exports = LogEntry;

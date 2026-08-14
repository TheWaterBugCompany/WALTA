// A single persisted log line: a domain entity
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

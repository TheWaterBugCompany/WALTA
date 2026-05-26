// Dev-only WB-118 repro aid (gated in index-app on deployType !== 'production').
// Holds a buffer to consume RAM and provoke iOS memory warnings on devices with
// more headroom than the 3 GB iPad that crashes. Tune up until warnings appear
// WITHOUT an immediate jetsam — an OOM-kill is a clean SIGKILL, a different
// signature from the proxy-purge race we're chasing.
let _held = null;

const PAGE = 4096;

exports.inflate = function (megabytes) {
    const mb = Math.max(0, Math.floor(megabytes));
    if (mb === 0) { _held = null; return 0; }
    _held = new Uint8Array(mb * 1024 * 1024);
    // Touch one byte per page so iOS counts the pages as resident rather than
    // lazily reserving them — otherwise the ballast never pressures memory.
    for (let i = 0; i < _held.length; i += PAGE) _held[i] = 1;
    return _held.length;
};

exports.deflate = function () { _held = null; };

exports.heldBytes = function () { return _held ? _held.length : 0; };

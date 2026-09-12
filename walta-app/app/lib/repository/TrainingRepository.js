const SampleTray = require("../models/SampleTray");
const Taxon = require("../models/Taxon");

// Persists and hydrates the training SampleTray. Its tables live in the shared
// non-Alloy `waterbug_data` DB — a *different* DB from Alloy's `samples`
// archive, which is what every sync/upload/history query runs against, so
// training data can never leak into them. LogRepository-style: `open()` expects
// the schema to already exist (Migrator.migrate has run).
//
// This is the persistence seam: it creates the domain models (SampleTray/Taxon)
// and writes them; the models know nothing about it. The controller calls the
// repository; the models never call back (no fat model).
//
// One active session at a time. The session persists so an app the OS reclaims
// while backgrounded resumes where it left off (currentSessionCode + loadTray
// after a restart). Cleared only on an explicit new session or clear().

// A route stored before a taxonomy edit is no longer readable as one; an
// unreadable route is simply no route, and the key falls back to guessing.
function parseRoute(stored) {
    if (!stored) return null;
    try { return JSON.parse(stored); } catch (e) { return null; }
}

exports.open = function (dbName) {
    const db = Ti.Database.open(dbName);

    function wipe() {
        db.execute("DELETE FROM training_taxa");
        db.execute("DELETE FROM training_session");
    }

    return {
        startSession: function (sessionCode) {
            wipe();
            db.execute("INSERT INTO training_session (sessionCode) VALUES (?)", sessionCode);
            return new SampleTray();
        },

        currentSessionCode: function () {
            const rs = db.execute("SELECT sessionCode FROM training_session LIMIT 1");
            let code = null;
            if (rs.isValidRow()) code = rs.fieldByName("sessionCode");
            rs.close();
            return code;
        },

        loadTray: function () {
            const rs = db.execute("SELECT id, taxonId, position, route FROM training_taxa ORDER BY position");
            const taxa = [];
            try {
                while (rs.isValidRow()) {
                    taxa.push(new Taxon({
                        id: rs.fieldByName("id"),
                        taxonId: rs.fieldByName("taxonId"),
                        position: rs.fieldByName("position"),
                        route: parseRoute(rs.fieldByName("route"))
                    }));
                    rs.next();
                }
            } finally {
                rs.close();
            }
            return new SampleTray(taxa);
        },

        addTaxon: function (tray, taxonId, position, route) {
            db.execute(
                "INSERT INTO training_taxa (taxonId, position, route) VALUES (?, ?, ?)",
                taxonId, position, route ? JSON.stringify(route) : null
            );
            const taxon = new Taxon({ id: db.lastInsertRowId, taxonId: taxonId, position: position, route: route || null });
            tray.add(taxon);
            return taxon;
        },

        removeTaxon: function (tray, taxon) {
            db.execute("DELETE FROM training_taxa WHERE id = ?", taxon.id);
            tray.remove(taxon);
        },

        clear: function () {
            wipe();
        },

        close: function () {
            db.close();
        }
    };
};

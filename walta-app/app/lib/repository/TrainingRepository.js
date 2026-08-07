const SampleTray = require("../models/SampleTray");
const Taxon = require("../models/Taxon");

// Persists and hydrates the training SampleTray, in its own `waterbug_training`
// DB — kept entirely apart from the real-sample archive so training data can
// never leak into sync/upload/history. LogRepository-style: `open()` expects
// the schema to already exist (Migrator.migrate has run).
//
// This is the persistence seam: it creates the domain models (SampleTray/Taxon)
// and writes them; the models know nothing about it. The controller calls the
// repository; the models never call back (no fat model).
//
// One active session at a time. The session persists so an app the OS reclaims
// while backgrounded resumes where it left off (currentSessionCode + loadTray
// after a restart). Cleared only on an explicit new session or clear().

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
            const rs = db.execute("SELECT id, taxonId, position FROM training_taxa ORDER BY position");
            const taxa = [];
            try {
                while (rs.isValidRow()) {
                    taxa.push(new Taxon({
                        id: rs.fieldByName("id"),
                        taxonId: rs.fieldByName("taxonId"),
                        position: rs.fieldByName("position")
                    }));
                    rs.next();
                }
            } finally {
                rs.close();
            }
            return new SampleTray(taxa);
        },

        addTaxon: function (tray, taxonId, position) {
            db.execute(
                "INSERT INTO training_taxa (taxonId, position) VALUES (?, ?)",
                taxonId, position
            );
            const taxon = new Taxon({ id: db.lastInsertRowId, taxonId: taxonId, position: position });
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

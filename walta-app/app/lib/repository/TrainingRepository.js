// Persistence for a training session's ordered taxa, in its own
// `waterbug_training` DB — kept entirely apart from the real-sample archive so
// training data can never leak into sync/upload/history. LogRepository-style:
// `open()` expects the schema to already exist (Migrator.migrate has run).
//
// One active session at a time. The session persists so an app that the OS
// reclaims while backgrounded resumes where it left off (currentSession +
// listTaxa after a restart). Cleared only on an explicit new session or clear().
//
// This is a dumb persistence layer: `addTaxon` stores the caller-supplied
// position rather than deciding placement itself — the tray's append policy
// lives in the caller. `id` is a stable per-taxon key (the tray's verdict key);
// `position` is the tray slot.

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
        },

        currentSession: function () {
            const rs = db.execute("SELECT sessionCode FROM training_session LIMIT 1");
            let code = null;
            if (rs.isValidRow()) code = rs.fieldByName("sessionCode");
            rs.close();
            return code;
        },

        addTaxon: function (taxonId, position) {
            db.execute(
                "INSERT INTO training_taxa (taxonId, position) VALUES (?, ?)",
                taxonId, position
            );
            return { id: db.lastInsertRowId, taxonId: taxonId, position: position };
        },

        listTaxa: function () {
            const rs = db.execute("SELECT id, taxonId, position FROM training_taxa ORDER BY position");
            const rows = [];
            try {
                while (rs.isValidRow()) {
                    rows.push({
                        id: rs.fieldByName("id"),
                        taxonId: rs.fieldByName("taxonId"),
                        position: rs.fieldByName("position")
                    });
                    rs.next();
                }
            } finally {
                rs.close();
            }
            return rows;
        },

        removeTaxon: function (id) {
            db.execute("DELETE FROM training_taxa WHERE id = ?", id);
        },

        clear: function () {
            wipe();
        },

        close: function () {
            db.close();
        }
    };
};

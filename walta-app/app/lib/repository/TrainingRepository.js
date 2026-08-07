// Persistence for a training session's ordered taxa, in its own
// `waterbug_training` DB — kept entirely apart from the real-sample archive so
// training data can never leak into sync/upload/history. LogRepository-style:
// `open()` expects the schema to already exist (Migrator.migrate has run).
//
// One active session at a time. Training does NOT resume across a process
// restart: `open()` wipes any stale rows so every launch starts fresh. The
// session code lives in memory for the current run only.

exports.open = function (dbName) {
    const db = Ti.Database.open(dbName);
    let sessionCode = null;

    function wipe() {
        db.execute("DELETE FROM training_taxa");
        sessionCode = null;
    }

    function nextPosition() {
        const rs = db.execute("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM training_taxa");
        const next = rs.fieldByName("next");
        rs.close();
        return next;
    }

    wipe();

    return {
        startSession: function (code) {
            wipe();
            sessionCode = code;
        },

        currentSession: function () {
            return sessionCode;
        },

        addTaxon: function (taxonId) {
            const position = nextPosition();
            db.execute(
                "INSERT INTO training_taxa (position, taxonId) VALUES (?, ?)",
                position, taxonId
            );
            return { id: db.lastInsertRowId, position: position, taxonId: taxonId };
        },

        list: function () {
            const rs = db.execute("SELECT id, position, taxonId FROM training_taxa ORDER BY position");
            const rows = [];
            try {
                while (rs.isValidRow()) {
                    rows.push({
                        id: rs.fieldByName("id"),
                        position: rs.fieldByName("position"),
                        taxonId: rs.fieldByName("taxonId")
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

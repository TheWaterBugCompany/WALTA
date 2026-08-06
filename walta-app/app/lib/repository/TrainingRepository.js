// Persistence for a training session's ordered taxa, in its own
// `waterbug_training` DB — kept entirely apart from the real-sample archive so
// training data can never leak into sync/upload/history. LogRepository-style:
// `open()` expects the schema to already exist (Migrator.migrate has run).
//
// One active session at a time. startSession begins a fresh one (clearing any
// prior); currentSession + list resume the persisted one after a restart.

exports.open = function (dbName) {
    const db = Ti.Database.open(dbName);

    function wipe() {
        db.execute("DELETE FROM training_taxa");
        db.execute("DELETE FROM training_session");
    }

    function nextPosition() {
        const rs = db.execute("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM training_taxa");
        const next = rs.fieldByName("next");
        rs.close();
        return next;
    }

    return {
        startSession: function (sessionCode) {
            wipe();
            db.execute(
                "INSERT INTO training_session (sessionCode, startedAt) VALUES (?, ?)",
                sessionCode, Date.now()
            );
        },

        currentSession: function () {
            const rs = db.execute("SELECT sessionCode FROM training_session LIMIT 1");
            let code = null;
            if (rs.isValidRow()) code = rs.fieldByName("sessionCode");
            rs.close();
            return code;
        },

        addTaxon: function (taxonId) {
            const code = this.currentSession();
            const position = nextPosition();
            db.execute(
                "INSERT INTO training_taxa (sessionCode, position, taxonId) VALUES (?, ?, ?)",
                code, position, taxonId
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

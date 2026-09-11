// Persists the belt level a user has earned, one row per user in the shared
// non-Alloy `waterbug_data` DB. Server sync is not in scope: this is the local
// record only. LogRepository-style: `open()` expects the schema to already
// exist (Migrator.migrate has run).
//
// A user who is not signed in still earns belts, so they need a row too.
// SQLite permits several NULLs in a TEXT primary key, so NULL can't be the key
// that holds them to one row — the signed-out user gets a reserved key instead,
// and `null` stays the way callers ask for them. CERDI user ids are numeric, so
// the reserved key can never collide with a real one.
const SIGNED_OUT = "signed-out";

function keyFor(userId) {
    return userId === null || userId === undefined ? SIGNED_OUT : String(userId);
}

exports.open = function (dbName) {
    const db = Ti.Database.open(dbName);

    function levelFor(key) {
        const rs = db.execute("SELECT beltLevel FROM user WHERE userId = ?", key);
        let level = null;
        try {
            if (rs.isValidRow()) level = rs.fieldByName("beltLevel");
        } finally {
            rs.close();
        }
        return level;
    }

    function setLevel(key, level) {
        db.execute("INSERT INTO user (userId, beltLevel) VALUES (?, ?) " +
                   "ON CONFLICT(userId) DO UPDATE SET beltLevel = excluded.beltLevel", key, level);
    }

    function syncedLevelFor(key) {
        const rs = db.execute("SELECT syncedBeltLevel FROM user WHERE userId = ?", key);
        let level = null;
        try {
            if (rs.isValidRow()) level = rs.fieldByName("syncedBeltLevel");
        } finally {
            rs.close();
        }
        return level;
    }

    return {
        beltLevelFor: function (userId) {
            return levelFor(keyFor(userId));
        },

        awardBeltLevel: function (userId, level) {
            setLevel(keyFor(userId), level);
        },

        // The level waiting to reach the server, or null when it is already
        // there. Derived from the two columns rather than a flag of its own,
        // so there is no second record to fall out of step.
        beltNeedingPush: function (userId) {
            const key = keyFor(userId);
            const held = levelFor(key);
            if (held === null) return null;
            return held === syncedLevelFor(key) ? null : held;
        },

        markBeltPushed: function (userId, level) {
            db.execute("UPDATE user SET syncedBeltLevel = ? WHERE userId = ?", level, keyFor(userId));
        },

        // Hands the signed-out user's belt to the account that just signed in,
        // and clears it so the next signed-out user doesn't inherit it. Keeps
        // whichever belt is higher — reconciling against the server's idea of
        // the level is later work, but silently demoting someone here is not
        // something a later card can undo.
        claimAnonymousBelt: function (userId) {
            const pending = levelFor(SIGNED_OUT);
            if (pending === null) return;
            const key = keyFor(userId);
            const held = levelFor(key);
            if (held === null || pending > held) setLevel(key, pending);
            db.execute("DELETE FROM user WHERE userId = ?", SIGNED_OUT);
        },

        close: function () {
            db.close();
        },
    };
};

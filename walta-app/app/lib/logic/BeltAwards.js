const Belts = require("logic/Belts");

// Awards and reports belts. Sits between the training session that earns one
// and the store that keeps it, so neither has to know who is signed in.
// Titanium-free.
module.exports = function createBeltAwards({ repository, exercises, cerdiApi }) {

    // null is how the store is asked for the signed-out user, and is what
    // retrieveUserId gives back when nobody is signed in.
    function currentUserId() {
        const id = cerdiApi.retrieveUserId();
        return id === null || id === undefined ? null : String(id);
    }

    // Takes the server's belt when it beats the one held here, and records it
    // as already pushed: it came from the server, so sending it back would be
    // the only thing left pending.
    function reconcileWithServer() {
        const userId = currentUserId();
        if (userId === null) return Promise.resolve();
        return cerdiApi.retrieveUser().then((user) => {
            const onServer = user.qaqc_level;
            if (!onServer) return;
            const held = repository.beltLevelFor(userId);
            if (held !== null && held >= onServer) return;
            repository.awardBeltLevel(userId, onServer);
            repository.markBeltPushed(userId, onServer);
        });
    }

    // Records the level it sent rather than the level held afterwards, so a
    // belt earned while the write is in flight stays pending.
    function sendPendingLevel(userId) {
        const level = repository.beltNeedingPush(userId);
        if (level === null) return Promise.resolve();
        return cerdiApi.updateUser({ belt_level: level })
            .then(() => repository.markBeltPushed(userId, level));
    }

    // Reads before writing: a belt earned offline here must not demote an
    // account another device has already promoted.
    function pushPendingBelt() {
        const userId = currentUserId();
        if (userId === null) return Promise.resolve();
        if (repository.beltNeedingPush(userId) === null) return Promise.resolve();
        return reconcileWithServer().then(() => sendPendingLevel(userId));
    }

    return {
        reconcileWithServer,
        pushPendingBelt,

        // Belts go up, never down: repeating an easier session leaves the
        // harder belt alone. Returns the level held afterwards, or null when
        // the session carries no belt.
        awardFor(sessionCode) {
            const earned = exercises.beltLevelFor(sessionCode);
            if (!earned) return null;
            const userId = currentUserId();
            const held = repository.beltLevelFor(userId);
            if (held !== null && held >= earned) return held;
            repository.awardBeltLevel(userId, earned);
            return earned;
        },

        currentBelt() {
            return Belts.at(repository.beltLevelFor(currentUserId()));
        },

        claimAnonymousBelt() {
            repository.claimAnonymousBelt(currentUserId());
        },
    };
};

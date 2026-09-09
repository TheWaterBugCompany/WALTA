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

    return {
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

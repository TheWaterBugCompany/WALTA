// The belt a training level earns, as the two colours a belt is made of: the
// bulk of it, and its tip. Levels run 1..HIGHEST in the order they are earned —
// the tip advances through the colours before the belt itself moves up.
const YELLOW = "#FEFF46";
const ORANGE = "#F4C437";
const GREEN = "#9ED67B";
const BARE = "#FFFFFF";

const BELTS = [
    { color: YELLOW, tipColor: BARE },
    { color: YELLOW, tipColor: YELLOW },
    { color: YELLOW, tipColor: ORANGE },
    { color: ORANGE, tipColor: YELLOW },
    { color: ORANGE, tipColor: ORANGE },
    { color: ORANGE, tipColor: GREEN },
    { color: GREEN, tipColor: ORANGE },
    { color: GREEN, tipColor: GREEN },
];

exports.HIGHEST = BELTS.length;

// Null below the first level — that is a user who has not earned a belt, not an
// error. Levels past the last stay on the highest belt, so a future session
// added ahead of its artwork can't blank the badge.
exports.at = function (level) {
    if (!level || level < 1) return null;
    return BELTS[Math.min(level, BELTS.length) - 1];
};

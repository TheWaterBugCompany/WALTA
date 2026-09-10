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

// What the belt is called, for anyone who cannot see it — a screen reader, or
// a test. Named after the two colours it is drawn in, so the artwork and the
// name can never disagree.
const NAMES = {};
NAMES[YELLOW] = "yellow";
NAMES[ORANGE] = "orange";
NAMES[GREEN] = "green";
NAMES[BARE] = "white";

exports.describe = function (belt) {
    if (!belt) return null;
    const name = capitalise(NAMES[belt.color]) + " belt";
    if (belt.tipColor === belt.color) return name;
    const tip = NAMES[belt.tipColor];
    return `${name} with ${article(tip)} ${tip} tip`;
};

function capitalise(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function article(word) {
    return /^[aeiou]/.test(word) ? "an" : "a";
}

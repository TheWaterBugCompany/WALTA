// The belt a training level earns, as the colours a belt is drawn in: the bulk
// of it, and its tip where it has one. Levels run 1..HIGHEST in the order they
// are earned — a belt is first tipped in the next colour up, then takes that
// colour outright.
const YELLOW = "#FEFF46";
const ORANGE = "#F4C437";
const GREEN = "#9ED67B";
const BLUE = "#6FA8DC";
const BLACK = "#000000";
const WHITE = "#FFFFFF";

const BELTS = [
    { color: WHITE, tipColor: YELLOW },
    { color: YELLOW, tipColor: null },
    { color: YELLOW, tipColor: ORANGE },
    { color: ORANGE, tipColor: null },
    { color: ORANGE, tipColor: GREEN },
    { color: GREEN, tipColor: null },
    { color: GREEN, tipColor: BLUE },
    { color: BLUE, tipColor: null },
    { color: BLUE, tipColor: BLACK },
    { color: BLACK, tipColor: null },
];

exports.HIGHEST = BELTS.length;

// Null below the first level — that is a user who has never trained, wearing
// the plain white belt the ladder starts above, not an error. Levels past the
// last stay on the highest belt, so a future session added ahead of its artwork
// can't blank the badge.
exports.at = function (level) {
    if (!level || level < 1) return null;
    return BELTS[Math.min(level, BELTS.length) - 1];
};

// What the belt is called, for anyone who cannot see it — a screen reader, or
// a test. Named after the colours it is drawn in, so the artwork and the name
// can never disagree.
const NAMES = {};
NAMES[YELLOW] = "yellow";
NAMES[ORANGE] = "orange";
NAMES[GREEN] = "green";
NAMES[BLUE] = "blue";
NAMES[BLACK] = "black";
NAMES[WHITE] = "white";

// The same belt named to sit inside a sentence of the caller's own — "your
// white with yellow tip belt" — rather than standing on its own.
exports.nameOf = function (belt) {
    if (!belt) return null;
    const color = NAMES[belt.color];
    return belt.tipColor ? `${color} with ${NAMES[belt.tipColor]} tip` : color;
};

exports.describe = function (belt) {
    if (!belt) return null;
    const name = capitalise(NAMES[belt.color]) + " belt";
    if (!belt.tipColor) return name;
    const tip = NAMES[belt.tipColor];
    return `${name} with ${article(tip)} ${tip} tip`;
};

function capitalise(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function article(word) {
    return /^[aeiou]/.test(word) ? "an" : "a";
}

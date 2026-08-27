import { Jimp } from "jimp";

// A screenshot with nothing on it is not a capture. The pipeline has two ways of
// producing one: an Android WebView whose layer hasn't drawn, which leaves a white
// page carrying only its close button and scrollbars, and an iOS simulator
// screenshot that catches nothing composited, which is flat black. Both look like
// a screen to every later stage — and a blank blessed as a baseline makes every
// later run of that screen pass while showing nothing.
//
// Ink is the fraction of pixels that differ from the frame's most common colour,
// so it reads the same whichever colour the empty frame happens to be. Every real
// screen in the suite measures 6.6% or more; the blanks measure 1.0% (window
// chrome alone) and 0.09%. The floor sits well below the sparsest real screen so
// that a screen legitimately lighter than the rest doesn't trip it.
const MIN_INK = 0.03;
const TOLERANCE = 12;
const BUCKET = 4;

function background(data) {
    const counts = new Map();
    let best = 0;
    let mode = 0;
    for (let i = 0; i < data.length; i += 4) {
        const key = (data[i] >> BUCKET << 16) | (data[i + 1] >> BUCKET << 8) | (data[i + 2] >> BUCKET);
        const count = (counts.get(key) || 0) + 1;
        counts.set(key, count);
        if (count > best) { best = count; mode = i; }
    }
    return [data[mode], data[mode + 1], data[mode + 2]];
}

export async function inkFraction(file) {
    const { data } = (await Jimp.read(file)).bitmap;
    const base = background(data);
    let different = 0;
    for (let i = 0; i < data.length; i += 4) {
        if (Math.abs(data[i] - base[0]) > TOLERANCE
            || Math.abs(data[i + 1] - base[1]) > TOLERANCE
            || Math.abs(data[i + 2] - base[2]) > TOLERANCE) {
            different++;
        }
    }
    return different / (data.length / 4);
}

export async function looksBlank(file, { minInk = MIN_INK } = {}) {
    return (await inkFraction(file)) < minInk;
}

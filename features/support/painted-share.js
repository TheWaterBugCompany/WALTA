'use strict';
const { Jimp } = require('jimp');

// How much of an element's own frame is painted over the background. For an
// element WDA reports as invisible because its frame extends past the window —
// a rotated one, say — this is what distinguishes "on screen" from "in the tree
// but nowhere to be seen". The frame is clamped to the window first, so the
// share is of the part that could be seen at all.
//
// Background here is the app's near-white page; anything darker in any channel
// counts as paint. The threshold sits between two measured shares of the home
// screen's top-right corner: 0.04 with no belt, where only the login text is
// painted, and 0.17-0.19 wearing one.
const SOLIDLY_PAINTED = 0.1;
const BACKGROUND_FLOOR = 240;

async function paintedShareOf(driver, element) {
    const { x, y } = await element.getLocation();
    const { width, height } = await element.getSize();
    const shot = await Jimp.read(Buffer.from(await driver.takeScreenshot(), 'base64'));
    const window = await driver.getWindowSize();
    const scale = shot.bitmap.width / window.width;

    const left = Math.max(0, Math.round(x * scale));
    const top = Math.max(0, Math.round(y * scale));
    const right = Math.min(shot.bitmap.width, Math.round((x + width) * scale));
    const bottom = Math.min(shot.bitmap.height, Math.round((y + height) * scale));

    const pixels = shot.bitmap.data;
    let painted = 0, total = 0;
    for (let row = top; row < bottom; row++) {
        for (let column = left; column < right; column++) {
            const at = (row * shot.bitmap.width + column) * 4;
            total++;
            if (pixels[at] < BACKGROUND_FLOOR || pixels[at + 1] < BACKGROUND_FLOOR
                || pixels[at + 2] < BACKGROUND_FLOOR) painted++;
        }
    }
    if (total === 0) return 0;
    return painted / total;
}

module.exports = { paintedShareOf, SOLIDLY_PAINTED };

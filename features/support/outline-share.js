'use strict';
const { Jimp } = require('jimp');

// How much of an element's own frame is taken up by the black outline drawn
// around it. For an element WDA reports as invisible because its frame extends
// past the window — a rotated one, say — this is what distinguishes "on screen"
// from "in the tree but nowhere to be seen". The frame is clamped to the window
// first, so the share is of the part that could be seen at all.
//
// The belt this measures is white at the first level, so counting "anything
// darker than the near-white page" barely sees it — 0.06 wearing one against
// 0.04 with none, too close to call. Its outline is the part that is always
// there and always black, and nothing else in the home screen's top-right
// corner comes near black: the login text is teal, the waterbug behind it grey.
// So the measured shares are 0.016 wearing a belt against a flat 0 with none,
// and the threshold sits well inside that gap.
const OUTLINE_DRAWN = 0.005;
const INK_CEILING = 90;

async function outlineShareOf(driver, element) {
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
    let inked = 0, total = 0;
    for (let row = top; row < bottom; row++) {
        for (let column = left; column < right; column++) {
            const at = (row * shot.bitmap.width + column) * 4;
            total++;
            if (pixels[at] < INK_CEILING && pixels[at + 1] < INK_CEILING
                && pixels[at + 2] < INK_CEILING) inked++;
        }
    }
    if (total === 0) return 0;
    return inked / total;
}

module.exports = { outlineShareOf, OUTLINE_DRAWN };

import { Jimp, diff } from "jimp";

// Pixel-diff two screenshots for layout regression. Unlike the colour-histogram
// compare in features/support/image-test.js (which deliberately ignores position
// and scale to catch "photo → placeholder"), this catches layout shifts — a moved
// button, a changed margin — so it is intentionally position- and size-sensitive.
//
// `threshold` is the per-pixel colour-distance tolerance passed to pixelmatch
// (0–1, higher ignores more anti-aliasing noise). `failRatio` is the fraction of
// differing pixels the screen may have and still pass — settled captures diff at
// 0, so the default is 0.
//
// A dimension change can't be pixel-diffed (pixelmatch needs matching sizes), so
// it is treated as an automatic failure rather than resized away — a screen that
// renders at a different size is itself a regression.
export async function compareScreenshots(baseline, actual, { threshold = 0.1, failRatio = 0 } = {}) {
    const a = await Jimp.read(baseline);
    const b = await Jimp.read(actual);
    const baselineSize = { width: a.bitmap.width, height: a.bitmap.height };
    const actualSize = { width: b.bitmap.width, height: b.bitmap.height };
    const dimensionsMatch = baselineSize.width === actualSize.width
        && baselineSize.height === actualSize.height;

    if (!dimensionsMatch) {
        return { pass: false, dimensionsMatch: false, diffRatio: 1, diffPixels: null,
            baselineSize, actualSize, diffImage: null };
    }

    const { percent, image } = diff(a, b, threshold);
    const totalPixels = baselineSize.width * baselineSize.height;
    const diffPixels = Math.round(percent * totalPixels);
    return {
        pass: percent <= failRatio,
        dimensionsMatch: true,
        diffRatio: percent,
        diffPixels,
        baselineSize,
        actualSize,
        diffImage: await image.getBuffer("image/png"),
    };
}

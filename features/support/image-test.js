const { Jimp } = require('jimp');
const { expect } = require('chai');

// Compare images via a 3D RGB colour histogram. The bug class we
// guard against ("creature photo replaced by placeholder") is
// fundamentally a colour-distribution change: a real photo has
// rich, varied colour; a placeholder is dominated by one or two
// solid colours. Histogram correlation captures this difference
// while being agnostic to where the creature sits in the frame,
// which platform stretched the source JPG, or what scale the
// Photo region is rendered at — all variances that defeated the
// pixel-diff approach when comparing iOS sim vs Android emulator
// renders of the same source image.
//
// The threshold was tuned against the project's existing baseline
// fixtures: identity comparison gives correlation = 1.0; the same
// creature photo rendered with a different aspect / framing gives
// ~0.97; two genuinely different creatures (Amphipoda vs
// Phreatoicidae) give ~0.45.

const HIST_BINS_PER_CHANNEL = 8;       // 8^3 = 512 buckets
const RESIZE_FOR_SPEED = 256;          // not for normalization — histogram is size-agnostic
const SIMILARITY_THRESHOLD = 0.95;

async function loadAndHistogram(filePath) {
    const img = await Jimp.read(filePath);
    img.resize({ w: RESIZE_FOR_SPEED, h: RESIZE_FOR_SPEED });
    return computeHistogram(img);
}

function computeHistogram(img) {
    const bins = HIST_BINS_PER_CHANNEL;
    const shift = 8 - Math.log2(bins);    // 8-bit channel → bins-bin index
    const hist = new Float64Array(bins * bins * bins);
    const data = img.bitmap.data;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i] >> shift;
        const g = data[i + 1] >> shift;
        const b = data[i + 2] >> shift;
        hist[(r * bins + g) * bins + b] += 1;
        count += 1;
    }
    if (count > 0) {
        for (let i = 0; i < hist.length; i += 1) hist[i] /= count;
    }
    return hist;
}

function correlation(h1, h2) {
    let mean1 = 0; let mean2 = 0;
    for (let i = 0; i < h1.length; i += 1) { mean1 += h1[i]; mean2 += h2[i]; }
    mean1 /= h1.length; mean2 /= h2.length;
    let num = 0; let d1 = 0; let d2 = 0;
    for (let i = 0; i < h1.length; i += 1) {
        const x1 = h1[i] - mean1;
        const x2 = h2[i] - mean2;
        num += x1 * x2;
        d1 += x1 * x1;
        d2 += x2 * x2;
    }
    const denom = Math.sqrt(d1 * d2);
    return denom === 0 ? 1 : num / denom;
}

async function assertLooksSame(refPath, curPath) {
    const refHist = await loadAndHistogram(refPath);
    const curHist = await loadAndHistogram(curPath);
    const corr = correlation(refHist, curHist);
    expect(corr,
        `colour-histogram correlation between ${refPath} and ${curPath} (threshold ≥ ${SIMILARITY_THRESHOLD})`)
        .to.be.at.least(SIMILARITY_THRESHOLD);
}

// Diagnostic only — used by ad-hoc node scripts to inspect why a
// comparison passed or failed. Not called from the test path.
async function imageSimilarity(refPath, curPath) {
    const refHist = await loadAndHistogram(refPath);
    const curHist = await loadAndHistogram(curPath);
    return correlation(refHist, curHist);
}

exports.assertLooksSame = assertLooksSame;
exports.imageSimilarity = imageSimilarity;

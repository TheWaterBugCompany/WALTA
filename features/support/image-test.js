const fs = require('fs');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { expect } = require('chai');

// Allow up to ~0.5% of pixels to differ. Covers sub-pixel rendering
// jitter and JPEG-decode variance without masking the placeholder-vs-real
// photo swap that WB-89 needs to catch.
const DIFF_TOLERANCE_FRACTION = 0.005;
const PIXELMATCH_OPTS = { threshold: 0.1, includeAA: false };

function readPng(filePath) {
    return PNG.sync.read(fs.readFileSync(filePath));
}

function assertLooksSame(refPath, curPath) {
    const ref = readPng(refPath);
    const cur = readPng(curPath);
    expect(cur.width, `image width (${curPath})`).to.equal(ref.width);
    expect(cur.height, `image height (${curPath})`).to.equal(ref.height);
    const diffPixels = pixelmatch(
        ref.data, cur.data, null,
        ref.width, ref.height,
        PIXELMATCH_OPTS,
    );
    const maxAllowed = Math.floor(ref.width * ref.height * DIFF_TOLERANCE_FRACTION);
    expect(diffPixels, `differing pixels between ${refPath} and ${curPath} (max ${maxAllowed})`)
        .to.be.at.most(maxAllowed);
}

function diffImages(refPath, curPath, diffPath) {
    const ref = readPng(refPath);
    const cur = readPng(curPath);
    const diff = new PNG({ width: ref.width, height: ref.height });
    pixelmatch(
        ref.data, cur.data, diff.data,
        ref.width, ref.height,
        PIXELMATCH_OPTS,
    );
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    fs.writeFileSync('/tmp/img1.png', PNG.sync.write(ref));
    fs.writeFileSync('/tmp/img2.png', PNG.sync.write(cur));
}

exports.assertLooksSame = assertLooksSame;
exports.diffImages = diffImages;

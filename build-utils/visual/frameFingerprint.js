import { Jimp } from "jimp";
import crypto from "crypto";

// Identifies what a captured frame actually shows, so two grabs of the same
// screen can be compared for "has it stopped changing yet".
//
// Hashes the decoded pixels rather than the PNG bytes: the bytes go through an
// encoder (and on iOS a rotation) on their way to disk, and a frame that has
// not changed has to fingerprint the same every time or every screen would
// burn its whole settle budget.
export async function fingerprint(file) {
    const image = await Jimp.read(file);
    return crypto.createHash("sha1").update(image.bitmap.data).digest("hex");
}

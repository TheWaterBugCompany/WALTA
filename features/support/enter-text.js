'use strict';

const { FIELD_DID_NOT_TAKE_TEXT } = require('./environmental-failures');

const MASKED = /^[\u2022\u25cf\u002a]+$/;

// Types text into a field and confirms it actually got there.
//
// WebDriverAgent answers 200 to a setValue that typed into nothing. XCUITest
// types into whatever holds keyboard focus, and a field that has not taken
// focus — because the tap that would focus it was swallowed while the previous
// field's keyboard was still animating away — receives none of it. The write
// looks like a success from every angle the driver can see.
//
// Unchecked, that is silent: the run carries on and fails much later on a
// screen that will not advance, with a message naming neither the field nor the
// write. So read the field back, write again while there is budget, and fail by
// name when the text never lands — the same polling discipline the permission
// alert and the picker tap already use, and for the same reason.
module.exports = async function enterText({
    field, text, write, read, blur, now = Date.now, timeoutMs = 20000,
}) {
    const deadline = now() + timeoutMs;
    let writes = 0;
    let held;
    do {
        await write(text);
        writes++;
        await blur();
        held = String(await read());
        if (held === String(text)) return writes;
        // A secure field hands back bullets rather than the characters. The
        // count still confirms the write — eight bullets for an eight-character
        // password — and a mask of the wrong length is still a failed write.
        if (MASKED.test(held) && held.length === String(text).length) return writes;
        // iOS hands back a TextArea's accessibility label where its value
        // should be, so a field that reads as its own name is one we cannot see
        // into. Re-typing would spend the whole budget to learn nothing; an
        // empty field reads back empty, not as its name, so a swallowed write
        // is still caught everywhere it can be seen at all.
        if (held === String(field)) return writes;
    } while (now() < deadline);
    // Say what the field held: a swallowed write reads back empty, while a read
    // that is looking in the wrong place reads back something else entirely.
    throw new Error(
        `${FIELD_DID_NOT_TAKE_TEXT}: "${field}" holds "${held}" after ${writes} write(s) of "${text}"`);
};

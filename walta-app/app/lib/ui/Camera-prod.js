/*
 * Camera wrapper — production.
 *
 * Thin pass-through to Ti.Media. Used on device builds. Simulator builds
 * are swapped to Camera-test.js by plugins/unittest/1.0/hooks/unittest.js
 * (the iOS simulator's image picker is either inert or runs in a system
 * process that cannot be driven by Appium, so we can't exercise the real
 * camera there).
 */

exports.hasCameraPermissions = function () {
    return Ti.Media.hasCameraPermissions();
};

exports.requestCameraPermissions = function (callback) {
    Ti.Media.requestCameraPermissions(callback);
};

exports.showCamera = function (options) {
    Ti.Media.showCamera(options);
};

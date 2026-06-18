/*
 * Gallery wrapper — production.
 *
 * Thin pass-through to Ti.Media's photo-gallery picker. Used on device builds.
 * Simulator builds are swapped to Gallery-test.js by plugins/unittest/1.0/hooks/unittest.js
 * (the OS photo picker is a system-process modal that Appium/WDA cannot drive,
 * so we can't exercise the real gallery there).
 */

exports.hasPhotoGalleryPermissions = function () {
    return Ti.Media.hasPhotoGalleryPermissions();
};

exports.requestPhotoGalleryPermissions = function (callback) {
    Ti.Media.requestPhotoGalleryPermissions(callback);
};

exports.openPhotoGallery = function (options) {
    Ti.Media.openPhotoGallery(options);
};

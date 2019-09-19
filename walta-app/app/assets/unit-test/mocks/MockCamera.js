var moment = require("lib/moment");
exports.simulatePhotoCapture = function(photoSelect) {
    // set a photo as if taken by the user
    var photoPath = Ti.Filesystem.getFile( Ti.Filesystem.resourcesDirectory, "unit-test/resources/site-mock.jpg" );
    var blob = { media: photoPath.read() };
    photoSelect.photoCapturedHandler(blob);
}
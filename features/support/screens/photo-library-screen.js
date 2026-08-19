const IosPhotoLibraryScreen = require('./ios-photo-library-screen');
const AndroidPhotoLibraryScreen = require('./android-photo-library-screen');

// The real OS photo picker has an entirely different element tree on each
// platform, so each gets its own screen class; this factory hands back the
// right one for the running platform.
function createPhotoLibraryScreen( world ) {
    return world.platform === 'ios'
        ? new IosPhotoLibraryScreen( world )
        : new AndroidPhotoLibraryScreen( world );
}
module.exports = createPhotoLibraryScreen;

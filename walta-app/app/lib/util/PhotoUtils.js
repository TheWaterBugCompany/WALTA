var Logger = require('util/Logger');
var info = (m, tag = "media") => Logger.debug(m, tag);
var log = (m, tag = "media") => Logger.log(m, tag);
// Pure decision: which base directory a stored photo path belongs to, and the
// segment to join onto it. Kept Ti-free so it's unit-testable.
//
// `file:///` values are legacy absolute paths that embed the iOS data-container
// UUID, which changes across app updates/reinstalls — so the stored prefix can
// point at a dead container. We collapse them to their basename and re-resolve
// against the *current* data directory, healing stale rows on read (WB-88).
function resolvePhotoLocation(path) {
    if ( path.startsWith("file:///") ) {
        return { dir: "data", name: path.slice(path.lastIndexOf("/") + 1) };
    } else if ( path.startsWith("/") ) {
        return { dir: "resources", name: path };
    } else {
        return { dir: "data", name: path };
    }
}

function absolutePath(path) {
    const { dir, name } = resolvePhotoLocation(path);
    const baseDir = dir === "resources"
        ? Ti.Filesystem.resourcesDirectory
        : Ti.Filesystem.applicationDataDirectory;
    return Ti.Filesystem.getFile(baseDir, name);
}

function loadPhoto(path) {
    info(`reading photo from ${path}`)
    return absolutePath(path).read();
}

// The photo's own pixel dimensions. Titanium will not fit an image to a box, so
// anything that wants to scale one has to do the arithmetic itself — and the
// arithmetic needs these two numbers. PhotoSelect.fitToView reads them the same way.
function photoSize(path) {
    var photo = loadPhoto(path);
    return { width: photo.width, height: photo.height };
}

function savePhoto( blob, filename  ) {
    var photoPath = absolutePath(filename);
    info(`saving photo to ${photoPath.nativePath}`);
    if ( photoPath.exists() ) {
        info("file already exists deleting");
        var result = photoPath.deleteFile();
        if ( !result ) {
            log(`Error deleting file: writable: ${photoPath.writable}`);
            throw new Error(`Unable to delete file ${photoPath}`);
        }         
    }

    var result = photoPath.write(blob);
    blob = null; 
    if ( !result ) {
        log(`Error writing file: exists: ${photoPath.exists()}`);
        throw new Error(`Unable to write file ${photoPath}`);
    }

    return photoPath.nativePath;
}

/*
 * needsOptimising / optimisePhoto — photo size reduction before upload.
 *
 * The CERDI API enforces a maximum upload size. Photos from modern phone cameras
 * can easily exceed this, so we optimise before uploading.
 *
 * Size threshold: 4 MB. Dimension cap: 1600px wide (maintaining aspect ratio).
 *
 * iOS-specific: the camera produces PNG blobs which are much larger than equivalent
 * JPEGs. A resize operation on a large PNG can trigger intermittent memory corruption
 * in the Titanium runtime on iOS, so we convert PNG→JPEG first (at 0.7 quality) to
 * reduce working memory, then check if a resize is still needed.
 *
 * Android produces JPEG directly from the camera, so the PNG conversion branch is
 * not reached in practice on Android.
 */
function needsOptimising( photo ) {
    info(`needsOptimisng photo.length = ${photo.length}`)
    let res = ( photo.length > 4*1024*1024 /*|| photo.width > 1600 || photo.height > 1600 */);
    return res;
}

function optimisePhoto( fullPhoto ) {
    var aspectRatio = (fullPhoto.height/fullPhoto.width);

    // iOS camera returns PNG; convert to JPEG before resizing to avoid memory corruption.
    if ( ( fullPhoto.mimeType === "image/png" ) ) {
        log(`got a PNG: converting photo into JPEG...`);
        fullPhoto = fullPhoto.imageAsCompressed(0.7);
        if ( ! fullPhoto ) {
            log(`Error converting photo: ${fileOrBlob}`);
            throw new Error("Unable to convert photo into JPEG");
        }
    }

    if ( needsOptimising(fullPhoto) ) {
        log(`file too big, size is ${fullPhoto.length/(1024*1024)}Mb, width = ${fullPhoto.width}, height = ${fullPhoto.height}, resizing and compressing photo...`);
        fullPhoto = fullPhoto.imageAsResized(1600, 1600*aspectRatio);
        info( `photo size in bytes ${fullPhoto.length}, width = ${fullPhoto.width}, height = ${fullPhoto.height}` )
        if ( ! fullPhoto ) {
            log(`Error resizing photo: ${fileOrBlob}`);
            throw new Error("Unable to resize photo");
        }
        log(`compressed size is ${fullPhoto.length/(1024*1024)}Mb, width = ${fullPhoto.width}, height = ${fullPhoto.height}`);
    }

    
    return fullPhoto;
}

exports.absolutePath = absolutePath;
exports.optimisePhoto = optimisePhoto;
exports.savePhoto = savePhoto;
exports.loadPhoto = loadPhoto;
exports.photoSize = photoSize;
exports.needsOptimising = needsOptimising;
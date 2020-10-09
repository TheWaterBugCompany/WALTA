var Crashlytics = require('util/Crashlytics');
var info = Ti.API.info;
var log = Crashlytics.log;
function absolutePath(path) {
    if ( path.startsWith("file:///") ) {
        info(`${path} starts with file:///`);
        return Ti.Filesystem.getFile(path);
    } else if ( path.startsWith("/") ) {
        info(`${path} starts with /`)
        return Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,path);
    } else {
        info(`${path} doesn't start with /`)
        return Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, path);
    }
}

function loadPhoto(path) {
    info(`reading ${path}`)
    return absolutePath(path).read();
}

function savePhoto( blob, filename  ) {
    var photoPath = absolutePath(filename);
    info(`File path ${photoPath.nativePath}`);
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

function needsOptimising( photo ) {
    let res = ( photo.length > 4*1024*1024 || photo.width > 1600 || photo.height > 1600 );
    return res;
}

function optimisePhoto( fullPhoto ) {
    var aspectRatio = (fullPhoto.height/fullPhoto.width);
    if ( needsOptimising(fullPhoto) ) {
        log(`file too big, size is ${fullPhoto.length/(1024*1024)}Mb, width = ${fullPhoto.width}, height = ${fullPhoto.height}, resizing and compressing photo...`);
        //if ( aspectRatio < )
        fullPhoto = fullPhoto.imageAsResized(1600, 1600*aspectRatio);
        info( `photo size in bytes ${fullPhoto.length}, width = ${fullPhoto.width}, height = ${fullPhoto.height}` )
        if ( ! fullPhoto ) {
            log(`Error resizing photo: ${fileOrBlob}`);
            throw new Error("Unable to resize photo");
        }
        log(`compressed size is ${fullPhoto.length/(1024*1024)}Mb, width = ${fullPhoto.width}, height = ${fullPhoto.height}`);
    }

    if ( ( fullPhoto.mimeType === "image/png" ) && ( Ti.Platform.osname !== "android") ) {
        log(`got a PNG: converting photo into JPEG...`);
        fullPhoto = fullPhoto.imageAsCompressed(0.9);
        if ( ! fullPhoto ) {
            log(`Error converting photo: ${fileOrBlob}`);
            throw new Error("Unable to convert photo into JPEG");
        }
    }
    return fullPhoto;
}

exports.optimisePhoto = optimisePhoto;
exports.savePhoto = savePhoto;
exports.loadPhoto = loadPhoto;
exports.needsOptimising = needsOptimising;
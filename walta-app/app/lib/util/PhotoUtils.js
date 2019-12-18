function debug(mess) { 
    Ti.API.debug(mess);
}

function absolutePath(path) {
    if ( path.startsWith("file:///") ) {
        debug(`${path} starts with file:///`);
        return Ti.Filesystem.getFile(path);
    } else if ( path.startsWith("/") ) {
        debug(`${path} starts with /`)
        return Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,path);
    } else {
        debug(`${path} doesn't start with /`)
        return Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, path);
    }
}

function loadPhoto(path) {
    debug(`reading ${path}`)
    return absolutePath(path).read();
}

function savePhoto( blob, filename  ) {
    var photoPath = absolutePath(filename);
    debug(`File path ${photoPath.nativePath}`);
    if ( photoPath.exists() ) {
        debug("file already exists deletin");
        var result = photoPath.deleteFile();
        if ( !result ) {
            Ti.API.error(`Error deleting file: writable: ${photoPath.writable}`);
            throw new Error(`Unable to delete file ${photoPath}`);
        }         
    }

    var result = photoPath.write(blob);
    blob = null; 
    if ( !result ) {
        Ti.API.error(`Error writing file: exists: ${photoPath.exists()}`);
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
        Ti.API.info(`file too big, size is ${fullPhoto.length/(1024*1024)}Mb, width = ${fullPhoto.width}, height = ${fullPhoto.height}, resizing and compressing photo...`);
        //if ( aspectRatio < )
        fullPhoto = fullPhoto.imageAsResized(1600, 1600*aspectRatio);
        debug( `photo size in bytes ${fullPhoto.length}, width = ${fullPhoto.width}, height = ${fullPhoto.height}` )
        if ( ! fullPhoto ) {
            Ti.API.error(`Error resizing photo: ${fileOrBlob}`);
            throw new Error("Unable to resize photo");
        }
        Ti.API.info(`compressed size is ${fullPhoto.length/(1024*1024)}Mb, width = ${fullPhoto.width}, height = ${fullPhoto.height}`);
    }

    if ( ( fullPhoto.mimeType === "image/png" ) && ( Ti.Platform.osname !== "android") ) {
        Ti.API.info(`got a PNG: converting photo into JPEG...`);
        fullPhoto = fullPhoto.imageAsCompressed(0.9);
        if ( ! fullPhoto ) {
            Ti.API.error(`Error converting photo: ${fileOrBlob}`);
            throw new Error("Unable to convert photo into JPEG");
        }
    }
    return fullPhoto;
}

exports.optimisePhoto = optimisePhoto;
exports.savePhoto = savePhoto;
exports.loadPhoto = loadPhoto;
exports.needsOptimising = needsOptimising;
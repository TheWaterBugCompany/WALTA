function removeFilesBeginningWith(prefix) {
    var appDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory);
    appDir.getDirectoryListing()
        .forEach( (f) => { 
            
            if ( f.slice(0,prefix.length) === prefix) {
                Ti.API.info(`deleting ${f}`);
                Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, f )
                    .deleteFile();
            }
        });
}
exports.removeFilesBeginningWith = removeFilesBeginningWith;

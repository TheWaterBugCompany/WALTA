var Logger = require('util/Logger');
var debug = (m, tag = "sample") => Logger.debug(m, tag);
function removeFilesBeginningWith(prefix) {
    var appDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory);
    appDir.getDirectoryListing()
        .forEach( (f) => {
            if ( f.slice(0,prefix.length) === prefix) {
                debug(`deleting ${f}`);
                Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, f )
                    .deleteFile();
            }
        });
}
exports.removeFilesBeginningWith = removeFilesBeginningWith;

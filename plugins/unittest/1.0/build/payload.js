Module._source_cache = {};
Module.prototype._oldGetSource = Module.prototype._getSource;
function _unitTestGetSource() {
    // the spec files unfortunately are not served up by the liveview file server
    // which is a pain for development but thats the way it is.
    if ( this.id === "/alloy/controllers/index" || this.id.includes("_spec") ) {
        var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, this.id + '.js');
        if ( !file.exists() ) {
            Ti.API.info(`file ${file.nativePath} doesn't exist :-(`);
        }
		return (file.read() || {}).text;
    } else {
        return this._oldGetSource();
    }
}
Module.prototype._getSource = _unitTestGetSource;
globalScope.__remove_module_from_preview_cache = function(id) {
    if ( Module.getCached(id) ) {
        delete Module._cache[id];
    } 
}
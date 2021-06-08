Module._source_cache = {};
Module.prototype._oldGetSource = Module.prototype._getSource;
function _unitTestGetSource() {
    if ( this.id === "/alloy/controllers/index" ) {
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
global.__hacked_live_view = true;
global.__remove_module_from_preview_cache = function(id) {
    if ( Module.getCached(id) ) {
        delete Module._cache[id];
    } 
}
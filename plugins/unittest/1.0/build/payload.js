Module.prototype._oldGetSource = Module.prototype._getSource;
function _unitTestGetSource() {
    if ( this.id === '/alloy/controllers/index' ) {
        Ti.API.info("Reading alloy/controllers/index.js locally");
        var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, this.id + '.js');
		return (file.read() || {}).text;
    } else {
        return this._oldGetSource();
    }
}
Module.prototype._getSource = _unitTestGetSource;
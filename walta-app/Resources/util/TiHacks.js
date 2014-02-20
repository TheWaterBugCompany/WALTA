/**
 * Functions to clearly mark Titanium Platform hackage...
 */
function convertTiUrlToWebViewUrl( url ) {
	if ( Ti.Platform.osname === 'android' ) {
		return url.replace(Ti.Filesystem.resourcesDirectory,'file:///android_asset/Resources/');
	} else {
		return url;
	}
}
exports.convertTiUrlToWebViewUrl = convertTiUrlToWebViewUrl;
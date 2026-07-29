
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

// Android fires 'postlayout' during a window transition, when the current
// activity can be momentarily null; reading a view's .size/.rect then throws
// "...getWindow() on a null object reference" and aborts the handler mid-layout,
// leaving the screen half-drawn. Run the layout work but treat that one transient
// failure as "not ready yet" (return false) so a postlayout handler can retry on
// the next event. Any other error propagates.
function attemptLayout( fn ) {
	try {
		fn();
		return true;
	} catch ( e ) {
		if ( e && /getWindow\(\)/.test( String( e.message ) ) ) {
			return false;
		}
		throw e;
	}
}
exports.attemptLayout = attemptLayout;
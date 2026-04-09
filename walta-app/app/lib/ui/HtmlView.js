
/*
 * walta/HtmlView
 *
 * Displays a HTML page.
 *  
 */


var TiHacks = require('util/TiHacks');
function createHtmlView( url ) {
	var webview = Ti.UI.createWebView({ url: TiHacks.convertTiUrlToWebViewUrl( url ), enableZoomControls: true  });
    webview.addEventListener('beforeload', function(e) {
        if  (/^(www|http)/.test(e.url.toString()))  { 
            webview.stopLoading(true);
            Ti.Platform.openURL(e.url);
        };
    });
	return { view: webview };
};
exports.createHtmlView = createHtmlView;
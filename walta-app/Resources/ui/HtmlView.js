/*
 * walta/HtmlView
 *
 * Displays a HTML page.
 *  
 */



function createHtmlView( url ) {
	var TiHacks = require('util/TiHacks');
	var webObj = {
		view: null,			 	// The Ti.UI.View for the user interface
	};
	webObj.view = Ti.UI.createWebView({ url: TiHacks.convertTiUrlToWebViewUrl( url ) });
	return webObj;
};
exports.createHtmlView = createHtmlView;
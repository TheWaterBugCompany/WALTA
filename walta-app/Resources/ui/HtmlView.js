/*
 * walta/HtmlView
 *
 * Displays a HTML page.
 *  
 */

var TiHacks = require('util/TiHacks');

function createHtmlView( url ) {
	
	var webObj = {
		view: null,			 	// The Ti.UI.View for the user interface
	};
	webObj.view = Ti.UI.createWebView({ url: TiHacks.convertTiUrlToWebViewUrl( url ) });
	return webObj;
};
exports.createHtmlView = createHtmlView;
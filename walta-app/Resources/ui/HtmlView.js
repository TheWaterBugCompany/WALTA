/*
 * walta/HtmlView
 *
 * Displays a HTML page.
 *  
 */

function createHtmlView( url ) {
	
	var webObj = {
		view: null,			 	// The Ti.UI.View for the user interface
	};
	webObj.view = Ti.UI.createWebView({ url: url });
	return webObj;
};
exports.createHtmlView = createHtmlView;
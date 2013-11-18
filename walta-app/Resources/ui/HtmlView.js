/*
 * walta/HtmlView
 *
 * Displays a HTML page.
 *  
 */

function createHtmlView( /* Ti.Filesystem.File */ file ) {
	
	var webObj = {
		view: null,			 	// The Ti.UI.View for the user interface
	};
	webObj.view = Ti.UI.createWebView({ url: file });
	return webObj;
};
exports.createHtmlView = createHtmlView;
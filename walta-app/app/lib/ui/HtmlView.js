/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
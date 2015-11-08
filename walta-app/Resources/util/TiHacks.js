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
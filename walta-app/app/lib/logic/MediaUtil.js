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
if ( typeof(_) == "undefined") _ = require('underscore')._;

function isPhotoUrl( url ) {
	return _hasExtension(url, [ "jpg", "png", "gif", "jpeg" ] );
}

function isVideoUrl( url ) {
	return _hasExtension(url, [ "mp4", "webm", "ogv" ] );
}

function _hasExtension( path, exts ) {
		var ext = path.split('.').pop();
		return _(exts).contains( ext );
};

function resolveMediaUrls( mediaUrls ) {
	return {
		photoUrls: _(mediaUrls).filter(
			function(url) {
				return isPhotoUrl(url);
			}),

		videoUrl: _.chain(mediaUrls).filter(
			function(url) {
				return isVideoUrl(url);
			}).first().value()
	};
}

exports.isPhotoUrl = isPhotoUrl;
exports.isVideoUrl = isVideoUrl;
exports.resolveMediaUrls = resolveMediaUrls;

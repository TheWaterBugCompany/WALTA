var _ = require('lib/underscore')._;

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
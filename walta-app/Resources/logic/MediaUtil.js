var _ = require('lib/underscore')._;

function hasExtension( path, exts ) {
		var ext = path.split('.').pop();
		return _(exts).contains( ext );
};

function resolveMediaUrls( mediaUrls ) {
	return {
		photoUrls: _(mediaUrls).filter( 
			function(url) { 
				return hasExtension(url, [ "jpg", "png", "gif", "jpeg" ] ); 
			}),
	
		videoUrl: _.chain(mediaUrls).filter( 
			function(url) { 
				return hasExtension(url, [ "mp4", "webm", "ogv" ] ); 
			}).first().value()
	};
}

exports.resolveMediaUrls = resolveMediaUrls;
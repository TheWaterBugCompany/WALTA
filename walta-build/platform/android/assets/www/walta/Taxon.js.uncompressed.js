define( "walta/Taxon", [ "dojo/_base/declare", "dojo/_base/array", "dojo/_base/lang", "walta/KeyNode" ], function( declare, array, lang, KeyNode ) {
	return declare( null, {
		
		id: null,			// XML based id
		name: "",			// User readable species scientific name
		commonName: "",		// Common name for species
		size: 0,			// Size in mm
		signalScore: 0,		// The signal score scalar
		
		habitat: "",		// Description of habitat
		movement: "",		// Description of how species moves
		confusedWith: "",   // This species is often confused with
		
		mediaUrls: [],		// List of media URLs
		
		photoUrls: null,
		videoUrl: null,
		
		parent: null,
		
		_hasExtension: function( path, exts ) {
			var ext = path.split('.').pop();
			return array.indexOf( exts, ext ) >= 0;
		},
		
		constructor: function( args ) {
			declare.safeMixin(this,args);
			
			// Process the media URLs to set media properties
			this.photoUrls = array.filter( this.mediaUrls, function(url) {
				return this._hasExtension(url, [ "jpg", "png", "gif", "jpeg" ] );
			}, this );
			
			var videoUrls = array.filter( this.mediaUrls, function(url) {
				return this._hasExtension(url, [ "mp4", "webm", "ogv" ] );
			}, this );
			
			if ( videoUrls.length > 0 ) {
				this.videoUrl = videoUrls[0];
			}
			
			
		}
	});
});
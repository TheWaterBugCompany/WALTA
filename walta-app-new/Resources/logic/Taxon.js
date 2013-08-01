var _ = require('lib/underscore')._;

function hasExtension( path, exts ) {
		var ext = path.split('.').pop();
		return _(exts).contains( ext );
};

function createTaxon( args ) {
	var txn = _.defaults( args, {
		id: null,			// XML based id
		name: "",			// User readable species scientific name
		commonName: "",		// Common name for species
		size: 0,			// Size in mm
		signalScore: 0,		// The signal score scalar
		
		habitat: "",		// Description of habitat
		movement: "",		// Description of how species moves
		confusedWith: "",   // This species is often confused with
		
		mediaUrls: [],		// List of media URLs
		
		photoUrls: [],
		videoUrl: null,
		
		parent: null		// A link to the parent taxon
	} );
	
	// Resolve any mediaUrls into correct typed variables
	txn.photoUrls = _(txn.mediaUrls)
		.filter( function(url) { return hasExtension(url, [ "jpg", "png", "gif", "jpeg" ] ); });
	
	txn.videoUrl = _.chain(txn.mediaUrls)
		.filter( function(url) { return hasExtension(url, [ "mp4", "webm", "ogv" ] ); } )
		.first()
		.value();
		
	return txn;
};

exports.createTaxon = createTaxon;

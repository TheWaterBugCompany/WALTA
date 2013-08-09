var _ = require('lib/underscore')._;

var MediaUtil = require('logic/MediaUtil');

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
		
		parent: null		// A link to the parent taxon
	} );
	
	return _(txn).extend( MediaUtil.resolveMediaUrls( txn.mediaUrls ) );

};

exports.createTaxon = createTaxon;

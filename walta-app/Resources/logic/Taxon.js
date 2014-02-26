

function createTaxon( args ) {
	var _ = require('lib/underscore')._;
	var MediaUtil = require('logic/MediaUtil');
	
	var txn = _.defaults( args, {
		id: null,			// XML based id
		name: "",			// User readable species scientific name
		commonName: "",		// Common name for species
		size: 0,			// Size in mm
		signalScore: 0,		// The signal score scalar
		
		habitat: "",		// Description of habitat
		movement: "",		// Description of how species moves
		confusedWith: "",   // This species is often confused with
		
		taxonomicLevel: "", // The taxonomic level
		
		mediaUrls: [],		// List of media URLs
		
		parentLink: null,		// A link to the parent taxon
		
		// Returns the full scientific name
		getScientificName: function() {
			return this.name;
		},
		
		// Returns the details formatted as HTML
		asDetailHtml: function() {
			return String.format(
				"<p><b>Size:</b> Up to %dmm</p>"
			+   "<p><b>Habitat:</b> %s</p>"
			+   "<p><b>Movement:</b> %s</p>"
			+	"<p><b>Confused with:</b> %s</p>"
			+	"<p><b>SIGNAL score: %d</b></p>",
				this.size,
				this.habitat,
				this.movement,
				this.confusedWith,
				this.signalScore
			);
		}
	} );
	
	return _(txn).extend( MediaUtil.resolveMediaUrls( txn.mediaUrls ) );

};

exports.createTaxon = createTaxon;

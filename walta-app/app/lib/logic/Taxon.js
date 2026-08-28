
var LAST_TAXON_ID_NUM = 0;

// Genus and species are italicised, family and above are not — binomial
// nomenclature rather than decoration, which is why it lives with the taxon and
// not with whatever happens to be drawing a name.
function isItalicisedRank( taxonomicLevel ) {
	return taxonomicLevel === 'genus' || taxonomicLevel === 'species';
}

function createTaxon( args ) {
	if ( typeof(_) == "undefined") _ = require('underscore')._;
	var MediaUtil = ( typeof( Titanium ) !== "undefined" ) ? require('logic/MediaUtil') : require('./MediaUtil');

	var txn = _.defaults( args, {
		taxonId: 'WB'.concat(LAST_TAXON_ID_NUM++),
		id: null,			// XML based id
		ref: "",			// Where a linked Taxon should jump to in the key if not a leaf node
		name: "",			// User readable species scientific name
		scientificName: [], // Array of scientific name elements { taxonomicLevel: ... , name: ... }
		commonName: "",		// Common name for species
		size: 0,			// Size in mm
		signalScore: 0,		// The signal score scalar

		habitat: "",		// Description of habitat
		movement: "",		// Description of how species moves
		confusedWith: "",   // This species is often confused with

		taxonomicLevel: "", // The taxonomic level

		description: "",    // Textual notes

		mediaUrls: [],		// List of media URLs

		parentLink: null,		// A link to the parent key question
		taxonParent: null, // a link to parent taxon

		// The displayed `name` is sometimes one of this taxon's scientific names and
		// sometimes a plain word ('gastropods'), so it is matched against them
		// rather than assumed to be one.
		isNameItalicised: function() {
			var self = this;
			var entry = _.find( this.scientificName, function( n ) { return n.name === self.name; } );
			return !!entry && isItalicisedRank( entry.taxonomicLevel );
		},

		getScientificName: function() {
			var name = "";
			_.each( this.scientificName, function( n ) {
				if ( name !== "") {
					name=name+", ";
				}
				name += n.taxonomicLevel + ": " + n.name;
			});
			return name;
		},

		// Returns the full scientific name
		getScientificNameHtml: function() {
			var htmlNames = "";

			_.each( this.scientificName, function( n ) {
				  var styledName = n.name;
				  if ( isItalicisedRank( n.taxonomicLevel ) )
				     styledName = "<i>" + styledName + "</i>";
				  htmlNames += n.taxonomicLevel + ": " + styledName + "<br>";
			});
			return htmlNames;
		},

		// Returns the details formatted as HTML
		asDetailHtml: function() {
			return `<p><b>Scientific Classification:</b><br>${this.getScientificNameHtml()}</p>\
<p><b>Size:</b> Up to ${this.size}mm</p>\
<p><b>Habitat:</b> ${this.habitat}</p>\
<p><b>Movement:</b> ${this.movement}</p>\
<p><b>Confused with:</b> ${this.confusedWith}</p>\
<p><b>SIGNAL score: ${this.signalScore}</b></p>\
<p>${this.description}</p>`;
		}
	} );

	return _(txn).extend( MediaUtil.resolveMediaUrls( txn.mediaUrls ) );
};

exports.createTaxon = createTaxon;
exports.isItalicisedRank = isItalicisedRank;

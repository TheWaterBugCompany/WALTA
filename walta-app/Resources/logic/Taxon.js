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

function createTaxon( args ) {
	var _ = require('lib/underscore')._;
	var MediaUtil = require('logic/MediaUtil');
	
	var txn = _.defaults( args, {
		id: null,			// XML based id
		ref: "",			// Where a linked Taxon should jump to in the key if not a leaf node
		name: "",			// User readable species scientific name
		commonName: "",		// Common name for species
		size: 0,			// Size in mm
		signalScore: 0,		// The signal score scalar
		
		habitat: "",		// Description of habitat
		movement: "",		// Description of how species moves
		confusedWith: "",   // This species is often confused with
		
		taxonomicLevel: "", // The taxonomic level
		
		description: "",    // Textual notes
		
		mediaUrls: [],		// List of media URLs
		
		parentLink: null,		// A link to the parent taxon
		
		// Returns the full scientific name
		getScientificNameHtml: function() {
			var htmlNames = "";
			
			_.each( this.scientificName, function( n ) {
				  var styledName = n.name;
				  if ( n.taxonomicLevel == 'genus' || n.taxonomicLevel == 'species' )
				     styledName = "<i>" + styledName + "</i>";
				  htmlNames += n.taxonomicLevel + ": " + styledName + "<br>";
			}); 
			return htmlNames;
		},
		
		// Returns the details formatted as HTML
		asDetailHtml: function() {
			return String.format(
				"<p><b>Scientific Classification:</b><br>%s</p>"
			+	"<p><b>Size:</b> Up to %dmm</p>"
			+   "<p><b>Habitat:</b> %s</p>"
			+   "<p><b>Movement:</b> %s</p>"
			+	"<p><b>Confused with:</b> %s</p>"
			+	"<p><b>SIGNAL score: %d</b></p>"
			+   "<p>%s</p>",
				this.getScientificNameHtml(),
				this.size,
				this.habitat,
				this.movement,
				this.confusedWith,
				this.signalScore,
				this.description
			);
		}
	} );
	
	return _(txn).extend( MediaUtil.resolveMediaUrls( txn.mediaUrls ) );

};

exports.createTaxon = createTaxon;

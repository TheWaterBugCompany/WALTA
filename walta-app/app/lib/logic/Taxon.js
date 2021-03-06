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

var LAST_TAXON_ID_NUM = 0;

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
				  if ( n.taxonomicLevel == 'genus' || n.taxonomicLevel == 'species' )
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

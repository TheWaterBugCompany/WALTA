if ( typeof(_) == "undefined") _ = require('underscore')._;

function createSpeedbugIndex( name, key )  {
  var speedbugIndex = {};
  return {
    speedbugIndexInternal: speedbugIndex,

    name: name,

    key: key,

    setKey: function( key ) {
      this.key = key;
    },

    // Adds a "Speed Bug" link, this allows a special index
    // to be displayed that jumps directly to a node within
    // a key by touching a silhouette image.

    addSpeedbugGroup: function( grpId ) {
      if ( ! _(speedbugIndex).has(grpId) ) {
        speedbugIndex[grpId] = { refId: grpId, bugs: [] };
      } else {
        speedbugIndex[grpId].refId = grpId;
      }
    },

    addSpeedbugIndex: function( imgUrl, grpId, refId) {
      speedbugIndex[grpId].bugs.push( { imgUrl: imgUrl, refId: refId } );
    },

    getSpeedbugFromTaxonId: function( taxonId ) {
      var taxon = this.key.findTaxonById( taxonId );
      return this.findSilhouette( taxon );
    },

		findSilhouette: function( node ) {
      if ( node.id ) {
        var bug = this.reverseLookup( node.id );

        if ( bug ) {
          Ti.API.info(`found: ${bug.imgUrl}`);
          return bug.imgUrl;
        } else {
          Ti.API.info(`can't find silhouette for: ${node.id}`);
          return;
        }
      }

      if ( node.parentLink )
        return this.findSilhouette( node.parentLink );
		},

    reverseLookup: function( refId ) {
      var foundBug;
      _(this.speedbugIndexInternal).each(
        (grp) => grp.bugs.forEach( (bug) => {
          if ( bug.refId == refId ) {
            foundBug = bug;
          }
        })
      );
      return foundBug;
    },

    setSpeedbugIndex: function( index ) {
      this.speedbugIndexInternal = index;
    },

    getSpeedbugIndex: function() {
			return this.speedbugIndexInternal;
		}

  };

}

exports.createSpeedbugIndex = createSpeedbugIndex;

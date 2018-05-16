if ( typeof(_) == "undefined") _ = require('underscore')._;

function createSpeedbugIndex() {
  var speedbugIndex = {};
  return {
    speedbugIndex: speedbugIndex,

    key: null,

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
        }
      }

      if ( node.parentLink )
        return this.findSilhouette( node.parentLink );
		},

    reverseLookup: function( refId ) {
      var foundBug;
      _(this.speedbugIndex).each(
        (grp) => grp.bugs.forEach( (bug) => {
          if ( bug.refId == refId ) {
            foundBug = bug;
          }
        })
      );
      return foundBug;
    },

    setSpeedbugIndex: function( index ) {
      this.speedbugIndex = index;
    },

    getSpeedbugIndex: function() {
			return this.speedbugIndex;
		}

  };

}

exports.createSpeedbugIndex = createSpeedbugIndex;

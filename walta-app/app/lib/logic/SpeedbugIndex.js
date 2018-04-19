if ( typeof(_) == "undefined") _ = require('underscore')._;

function createSpeedbugIndex() {
  var speedBugIndex = {};
  return {
    speedBugIndex: speedBugIndex,

    // Adds a "Speed Bug" link, this allows a special index
    // to be displayed that jumps directly to a node within
    // a key by touching a silhouette image.

    addSpeedbugGroup: function( grpId ) {
      if ( ! _(speedBugIndex).has(grpId) ) {
        speedBugIndex[grpId] = { refId: grpId, bugs: [] };
      } else {
        speedBugIndex[grpId].refId = grpId;
      }
    },

    addSpeedbugIndex: function( imgUrl, grpId, refId) {
      speedBugIndex[grpId].bugs.push( { imgUrl: imgUrl, refId: refId } );
    },

    // Searches for the speedbug silhouette for this taxon
		findSilhouette: function( node ) {
      if ( node.id ) {
        var bug = this.reverseLookup( node.id );
        console.log(`found bug: ${bug}`);
        if ( bug )
          return bug.imgUrl;
      }

      if ( node.parentLink )
        return this.findSilhouette( node.parentLink );
		},

    reverseLookup: function( refId ) {
      console.log(refId);
      var foundBug;
      _(this.speedBugIndex).each(
        (grp) => grp.bugs.forEach( (bug) => {
          if ( bug.refId == refId ) {
            foundBug = bug;
          }
        })
      );
      return foundBug;
    },

    getSpeedbugIndex: function() {
			return speedBugIndex;
		}

  };

}

exports.createSpeedbugIndex = createSpeedbugIndex;

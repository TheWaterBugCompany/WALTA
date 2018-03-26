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

    getSpeedbugIndex: function() {
			return speedBugIndex;
		}

  };

}

exports.createSpeedbugIndex = createSpeedbugIndex;

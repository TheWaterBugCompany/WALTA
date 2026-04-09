if ( typeof(_) == "undefined") _ = require('underscore')._;
var MediaUtil = require('./MediaUtil');

function createQuestion( args ) {

	var qn = _.defaults( args, {
			text: null,			  // The text to be displayed to the user
			mediaUrls: [],	  // A list of media items to be displayed (can be images, sound or movies)
			outcome: null     // Node to jump to on correct outcome
	} );

	return _(qn).extend( MediaUtil.resolveMediaUrls( qn.mediaUrls ) );
}

exports.createQuestion = createQuestion;

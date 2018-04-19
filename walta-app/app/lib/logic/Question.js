
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

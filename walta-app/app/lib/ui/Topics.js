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

/*
 * A global list of all PubSub topics this applciation uses
 * PubSub events provide a loosely coupled interface to
 * navigation logic with the app.
 */
var topics = { 
	
	HOME: 'home',
	SETTINGS: 'settings',
	INFO: 'info',
	
	// Open the video player
	VIDEO: 'video', // the filename is passed as parameter
	
	// Backwards on the decision tree
	BACK: 'back',
	
	// Forwards on the decision tree passing choice as parameter
	FORWARD: 'forward', // the choice number is passed as parameter
	
	// Jumps to a position in the key
	JUMPTO: 'jumpto',
	
	// Start the decision process from the beginning
	KEYSEARCH: 'keysearch',
	
	SPEEDBUG: 'speedbug',
	
	HELP: 'help',
	
	BROWSE: 'browse',
	
	GALLERY: 'gallery',
	
	ABOUT: 'about',
	subscribe: function( topic, callback ) {
		Ti.App.addEventListener( 'waterbug:' + topic, callback );
	},

	fireTopicEvent: function( topic, data ) {
		Ti.App.fireEvent( 'waterbug:' + topic, data );
	}
	
};



// Non-standard CommonJS but useful here
module.exports = topics;

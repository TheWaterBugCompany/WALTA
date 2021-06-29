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

	LOGGEDIN: 'loggedin',

	HOME: 'home',
	SETTINGS: 'settings',
	INFO: 'info',

	// Open the video player
	VIDEO: 'video', // the filename is passed as parameter

	// Backwards on the decision tree
	BACK: 'back',

	// Go up in the decision tree
	UP: 'up',

	// Forwards on the decision tree passing choice as parameter
	FORWARD: 'forward', // the choice number is passed as parameter

	// Jumps to a position in the key
	JUMPTO: 'jumpto',

	// Start the decision process from the beginning
	KEYSEARCH: 'keysearch',

	IDENTIFY: 'identify',

	MAYFLY_EMERGENCE: 'mayfly',

	ORDER: 'order',

	DETAILED: 'detailed',

	SAMPLETRAY: 'sampletray',

	SPEEDBUG: 'speedbug',

	SITEDETAILS: 'sitedetails',

	HABITAT: 'habitat',

	COMPLETE: 'complete',

	HISTORY: 'history', 

	HELP: 'help',

	BROWSE: 'browse',

	GALLERY: 'gallery',

	ABOUT: 'about',

	LOGIN: 'login',

	GPSLOCK: 'gpslock',

	FORCE_UPLOAD: 'forceupload',

	UPLOAD_PROGRESS: 'uploadprogress',

	// used to trap when a page is opened
	PAGE_OPENED: 'page_opened',

	unsubscribe: function( topic, callback ) {
		Alloy.Events.off( 'waterbug:' + topic, callback );
	},

	subscribe: function( topic, callback ) {
		Alloy.Events.on( 'waterbug:' + topic, callback );
	},

	fireTopicEvent: function( topic, data ) {
		Alloy.Events.trigger( 'waterbug:' + topic, data );
	}, 

	init: function() {
		// add a listener to bridge from webview to titanium events
		Ti.App.addEventListener("waterbug", function(e) {
			Alloy.Events.trigger(`waterbug:${e.event}`, e);
		})
	}

};

module.exports = topics;
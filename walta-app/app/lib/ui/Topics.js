
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

	NOTES: 'notes',

	// used to trap when a page is opened
	PAGE_OPENED: 'page_opened',

	// used to trap when pages are unloaded from the history
	PAGES_UNLOADED: 'page_unloaded',

	DISCARD_OR_SAVE: 'discard_or_save',

	unsubscribe: function( topic, callback ) {
		Alloy.Events.off( 'waterbug:' + topic, callback );
	},

	subscribe: function( topic, callback ) {
		Alloy.Events.on( 'waterbug:' + topic, callback );
	},

	fireTopicEvent: function( topic, data ) {
		if ( topic ) {
			Alloy.Events.trigger( 'waterbug:' + topic, data );
		} else {
			throw new Error("undefined topic");
		}
	}, 

	init: function() {
		// add a listener to bridge from webview to titanium events
		Ti.App.addEventListener("waterbug", function(e) {
			Alloy.Events.trigger(`waterbug:${e.event}`, e);
		})
	}

};

module.exports = topics;